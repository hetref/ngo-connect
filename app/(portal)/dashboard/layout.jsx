import React from "react";

const layout = ({ children }) => {
  return (
    <div className="h-full">
        <>
          <main>{children}</main>
        </>
    </div>
  );
};

export default layout;
