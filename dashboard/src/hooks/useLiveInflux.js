import { useState, useEffect } from 'react';
import { influxClient } from '../api/influxClient';

export function useLiveInflux(query, interval = 5000) {
  const [data, setData] = useState([]);
  const org = import.meta.env.VITE_INFLUX_ORG;

  const fetchData = () => {
    const queryApi = influxClient.getQueryApi(org);
    const results = [];

    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push({
          time: new Date(o._time).toLocaleTimeString(),
          value: o._value,
        });
      },
      error(e) { console.error("Flux Query Error: ", e); },
      complete() { setData(results); },
    });
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [query, interval]);

  return data;
}