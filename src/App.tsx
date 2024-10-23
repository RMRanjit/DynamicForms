import React from "react";
import "./App.css";
import FormRender from "./components/FormRender";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Box } from "@mui/material";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function App() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <FormRender />
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
