import React from "react";
import "./App.css";
import FormRender from "./components/FormRender";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">Dynamic Form</header> */}
      <FormRender />
    </div>
  );
}

export default App;
