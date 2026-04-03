declare module "@base-ui/react/button" {
  import * as React from "react";

  export const Button: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.RefAttributes<HTMLButtonElement>
  >;
}
