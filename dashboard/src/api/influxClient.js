import { InfluxDB } from '@influxdata/influxdb-client-browser';

const token = import.meta.env.VITE_INFLUX_TOKEN;
const url = import.meta.env.VITE_INFLUX_URL;

export const influxClient = new InfluxDB({ url, token });