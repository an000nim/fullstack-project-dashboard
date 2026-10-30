import React from "react";
import { createRoot } from "react-dom/client";
import { AgGridProvider } from "ag-grid-react";
import {
  ClientSideRowModelModule,
  InfiniteRowModelModule,
  RowSelectionModule,
} from "ag-grid-community";
import App from "./App.jsx";
import "./template/light-bootstrap-dashboard.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AgGridProvider
      modules={[
        ClientSideRowModelModule,
        InfiniteRowModelModule,
        RowSelectionModule,
      ]}
    >
      <App />
    </AgGridProvider>
  </React.StrictMode>,
);
