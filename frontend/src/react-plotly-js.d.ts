declare module 'react-plotly.js' {
  import * as React from 'react';
  import Plotly from 'plotly.js';

  export interface PlotParams {
    data: Partial<Plotly.PlotData>[];
    layout?: Partial<Plotly.Layout>;
    frames?: Partial<Plotly.Frame>[];
    config?: Partial<Plotly.Config>;
    onInitialized?: (figure: Partial<Plotly.PlotlyHTMLElement>, graphDiv: HTMLDivElement) => void;
    onUpdate?: (figure: Partial<Plotly.PlotlyHTMLElement>, graphDiv: HTMLDivElement) => void;
    onError?: (error: Error) => void;
    revision?: number | string;
    style?: React.CSSProperties;
    className?: string;
  }

  export default class Plot extends React.Component<PlotParams> {}
}