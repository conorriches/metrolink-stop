import { getStops, slugify } from "../lib/tfgm-metrolink";
import Link from "next/link";
import { useState } from "react";
import Fuse from "fuse.js";
import { useVisitedStopsState, useVisitedStopsUpdate } from "../components/context/VisitedStops";
import Button from "../components/Button";

/**
 * @param {Object} props
 * @param {{StationLocation: string, Line: string}[]} props.stops
 */
export default function Home({ stops }) {
  const [searchTerm, setSearchTerm] = useState("");
  const fuse = new Fuse(stops, { keys: ["StationLocation", "Line"], includeScore: true });
  const results = fuse.search(searchTerm);
  const stopResults = !!searchTerm ? results.map(({ item }) => item) : stops;

  const { recentStops } = useVisitedStopsState();
  const { reset } = useVisitedStopsUpdate();

  return (
    <main className="flex flex-col flex-1 w-full max-w-screen-md px-6 py-4 space-y-8">
      <h1 className="text-2xl font-semibold tracking-wide text-center uppercase">Metrolink stops</h1>

      {recentStops.length > 0 && (
        <section aria-labelledby="recently-visited" className="space-y-4">
          <div className="flex justify-between space-x-2">
            <div>
              <h2 id="recently-visited" className="text-lg font-semibold tracking-wide uppercase">
                Recently visited
              </h2>
            </div>
            <Button onClick={reset}>
              Clear <span className="sr-only">recently visited</span>
            </Button>
          </div>
          <ul className="px-4 py-4 space-y-2 bg-white rounded-md shadow dark:bg-gray-800 dark:border dark:border-gray-700 md:text-center">
            {recentStops.map((StationLocation) => (
              <li key={StationLocation}>
                <Link href={`/${slugify(StationLocation)}`}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a>{StationLocation}</a>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-stops">
        <h2
          id="all-stops"
          className={`text-lg font-semibold tracking-wide  uppercase ${recentStops.length == 0 ? "sr-only" : ""}`}
        >
          All stops
        </h2>
        <div className="space-y-4">
          <form onSubmit={(e) => e.preventDefault()}>
            <div role="search" className="flex flex-col items-start space-y-2 md:items-center">
              <label htmlFor="search">Search</label>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 bg-white border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700 md:max-w-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </form>

          <ul className="px-4 py-4 space-y-2 bg-white rounded-md shadow dark:bg-gray-800 dark:border dark:border-gray-700 md:text-center">
            {stopResults.map(({ StationLocation }) => (
              <li key={StationLocation}>
                <Link href={`/${slugify(StationLocation)}`}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a>{StationLocation}</a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export async function getStaticProps(context) {
  const stops = await getStops();

  // Sort alphabetically by default
  const sortedStops = stops.sort((a, b) => a.StationLocation.localeCompare(b.StationLocation));

  return {
    props: { stops: sortedStops }, // will be passed to the page component as props
  };
}
