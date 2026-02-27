import { BrowserRouter } from "react-router-dom";

import "../shared/styles/App.css";
import AnalyticsPageTracker from "../shared/analytics/pageTracking";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AnalyticsPageTracker />
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
