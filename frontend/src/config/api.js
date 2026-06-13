// Central API base URL — reads from environment variable in production,
// falls back to localhost for local development.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:4000/api";

export default BASE_URL;
