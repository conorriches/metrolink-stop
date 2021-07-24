import { o } from "odata";

const baseUrl = process.env.TFGM_ODATA_ENDPOINT;
const subscriptionKey = process.env.TFGM_ODATA_SUBSCRIPTION_KEY;

const tfgmO = () => {
  return o(baseUrl, {
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });
};

export async function getAll() {
  const metrolinks = await tfgmO().get("Metrolinks").query();

  return metrolinks;
}

/**
 * @returns {{StationLocation: string, Line: string}[]}
 */
export async function getStops() {
  // try quertying this stuff directly from the odata endpoint – actually learn it u boob
  // also figure out unit tests for quicker dev of this lib
  const metrolinks = await tfgmO().get("Metrolinks").query({
    $select: "StationLocation, Line",
  });

  // TODO: Source data only has one line PER location, which isn't useful when allowing users to filter station list by
  // line (St Peter's Square only showing up under Eccles). Maybe add manual corrections to this list?

  // Make unique (sort into tuples, station must come first!)
  const stationLineTuples = metrolinks.map(({ Line, StationLocation }) => [StationLocation, Line]);
  const linesByStation = Object.fromEntries(stationLineTuples);

  // Turn back into objs and return
  return Object.entries(linesByStation).map(([StationLocation, Line]) => ({ StationLocation, Line }));
}

/**
 * Information on a stop, departures, and any message board announcements.
 * @typedef {Object} StopInfo
 * @property {string} name - The name of the stop, which is equivalent to its locaton in the raw data.
 * @property {{destination: string, type: string, status: string, wait: number}} departures
 * @property {string[]} messages - Any message board announcements
 * @property {string} lastUpdated
 */

/**
 * Fetch information on a particular stop
 * @param {string} stopLocation
 * @returns {StopInfo}
 */
export async function getStopInfo(stopLocation) {
  const metrolinks = await tfgmO()
    .get("Metrolinks")
    .query({
      $filter: `StationLocation eq '${stopLocation}'`,
    });

  if (metrolinks.length === 0) {
    throw new Error(`No metrolink found matching ${stopLocation}`);
  }

  const { StationLocation: name } = metrolinks[0];

  // lastUpdated from the API is falsely presenting GMT as UTC (i.e. summer time
  // coming through with 'Z' timezone designation). Rather than deal with that noise,
  // let's just throw back the current date
  const lastUpdated = new Date().toISOString();

  // Dedupe departures on AtcoCode – each of these is a unique physical stop, so this will be dupe information
  const departuresByAtcoCode = Object.values(
    Object.fromEntries(
      metrolinks.map(({ AtcoCode, ...metrolinkEntity }) => [AtcoCode, { AtcoCode, ...metrolinkEntity }])
    )
  );
  const departures = departuresByAtcoCode
    .flatMap((metrolinkEntity) => {
      return [0, 1, 2, 3]
        .map((i) => {
          if (metrolinkEntity[`Dest${i}`].length === 0) {
            return false;
          }

          return {
            destination: metrolinkEntity[`Dest${i}`],
            type: metrolinkEntity[`Carriages${i}`],
            status: metrolinkEntity[`Status${i}`],
            wait: metrolinkEntity[`Wait${i}`],
          };
        })
        .filter((departure) => departure !== false);
    })
    .sort((a, b) => a.wait - b.wait);

  const messages = [...new Set(metrolinks.map(({ MessageBoard }) => MessageBoard))];

  return {
    name,
    departures,
    messages,
    lastUpdated,
  };
}