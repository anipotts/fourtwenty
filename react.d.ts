import * as React from "react";

declare module "react" {
  // Add any missing type definitions here
  export function useState<T>(
    initialState: T | (() => T)
  ): [T, (newState: T | ((prevState: T) => T)) => void];
  export function forwardRef<T, P>(
    Component: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): {
    (props: P & { ref?: React.Ref<T> }): React.ReactElement | null;
    displayName?: string;
  };

  export interface FunctionComponent<P = {}> {
    (props: P, context?: any): React.ReactElement<any, any> | null;
    displayName?: string;
  }

  export interface ForwardRefExoticComponent<P> {
    (props: P): React.ReactElement | null;
    displayName?: string;
  }

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
    [key: string]: any;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: "submit" | "reset" | "button";
    [key: string]: any;
  }

  export type ElementRef<C extends React.ComponentType<any>> =
    C extends React.ComponentType<infer P> ? React.ComponentRef<C> : never;

  export type ComponentPropsWithoutRef<C extends React.ComponentType<any>> =
    C extends React.ComponentType<infer P> ? P : never;
}
