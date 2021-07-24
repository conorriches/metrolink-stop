import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStops } from "../lib/tfgm-metrolink";

export default function Stop({ stop }) {
  const [stopInfo, setStopInfo] = useState();
  const [error, setError] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const { name, departures = [], messages = [], lastUpdated = "1970-01-01" } = stopInfo ?? {};
  const lastUpdatedDate = new Date(lastUpdated);

  //#region Continually refreshing stop data
  useEffect(async () => {
    let mounted = true;
    if (!stop) {
      return;
    }
    try {
      const req = await fetch(`/api/stop/${stop}`);
      const data = await req.json();

      if (mounted) {
        if (req.status == 200) {
          setStopInfo(data);
          setError(null);
        } else {
          setStopInfo(null);
          setError(data?.error);
        }
      }
    } catch (err) {
      console.log(err);
    }

    return () => {
      mounted = false;
    };
  }, [stop, refreshTrigger]);

  // Refresh every 30s
  useEffect(() => {
    const timeout = setTimeout(() => setRefreshTrigger(!refreshTrigger), 30 * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [refreshTrigger]);
  //#endregion

  return (
    <>
      <Head>
        <title>{name} stop info</title>
      </Head>
      <nav className="px-6 py-2">
        {/* (a stop chooser at some point in the future) */}
        <Link href="/">
          <a>
            <span aria-hidden>👈</span> Back to list of stops
          </a>
        </Link>
      </nav>
      <main className="flex flex-col flex-1 w-full max-w-screen-md px-6 py-4 space-y-8 md:space-y-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide text-center uppercase">{name}</h1>
        </div>
        <div className="space-y-2 md:space-y-6">
          <h2 className="font-semibold tracking-wide text-center text-gray-800 uppercase dark:text-gray-300">
            Departures
          </h2>
          <table className="w-full table-auto">
            <thead className="text-left">
              <tr>
                <th className="py-2 font-normal text-gray-600 dark:text-gray-400">Destination</th>
                <th className="py-2 font-normal text-gray-600 dark:text-gray-400">Type</th>
                <th className="py-2 font-normal text-gray-600 dark:text-gray-400">Status</th>
                <th className="py-2 font-normal text-gray-600 dark:text-gray-400">Wait</th>
              </tr>
            </thead>
            <tbody>
              {departures.length > 1 ? (
                departures.map(({ destination, type, status, wait }, i) => (
                  <tr key={i}>
                    <td className="py-1">{destination}</td>
                    <td className="py-1">{type}</td>
                    <td className="py-1">{status}</td>
                    <td>
                      <span>{wait}</span>
                      <abbr title="minutes">m</abbr>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-1 text-center">
                    (No departures currently listed)
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot></tfoot>
          </table>
        </div>
        <div className="space-y-2 md:space-y-6">
          <h2 className="font-semibold tracking-wide text-center text-gray-800 uppercase dark:text-gray-300">
            Message board
          </h2>

          <ul className="md:text-center">
            {messages.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </div>
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <p>Automatically updating every 30 seconds.</p>
          <p>
            Last update <time dateTime={lastUpdatedDate.toISOString()}>{lastUpdatedDate.toLocaleString()}</time>.
          </p>
        </div>
      </main>
    </>
  );
}

const slugify = (stop) => stop?.toLowerCase().replace(/ /g, "-");

export async function getStaticProps({ params: { stop: sluggedStop } }) {
  const stops = await getStops();
  const { StationLocation: stop } = stops.filter(
    ({ StationLocation }) => slugify(StationLocation) === sluggedStop
  )?.[0];

  return {
    props: { stop }, // will be passed to the page component as props
  };
}

export async function getStaticPaths() {
  const gottenStops = await getStops();
  const stops = gottenStops.map(({ StationLocation }) => StationLocation);
  const paths = stops.map((stop) => ({ params: { stop: slugify(stop) } }));

  return {
    paths,
    fallback: false,
  };
}