import React from "react";
import Spinner from "./Spinner";

const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Spinner />
    </div>
  );
};

export default Loading;
