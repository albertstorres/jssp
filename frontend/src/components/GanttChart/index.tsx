import './styles.css';
import Plot from 'react-plotly.js';

export interface GanttTask {
  operation: string;
  task: string;
  equipments: string[];   // Agora equipamentos é array de nomes
  team: string;
  begin: string;
  end: string;
}

interface GanttChartProps {
  data: GanttTask[];
}

const COLORS = [
  '#4A90E2', '#50E3C2', '#F5A623', '#B8E986', '#D0021B',
  '#8B572A', '#417505', '#9013FE', '#BD10E0', '#F8E71C'
];

function GanttChart({ data }: GanttChartProps) {
  const uniqueOperations = Array.from(new Set(data.map(d => d.operation)));

  const formattedData = data.map((task, index) => {
    const equipmentsText = task.equipments.length > 0
      ? task.equipments.join(', ')
      : 'Sem equipamentos';

    return {
      x: [task.begin, task.end],
      y: [task.operation],
      type: 'bar',
      orientation: 'h',
      name: `${task.team} - ${equipmentsText}`,
      marker: {
        color: COLORS[index % COLORS.length],
      },
      hovertemplate: `
        <b>Operação:</b> ${task.operation}<br>
        <b>Tarefa:</b> ${task.task}<br>
        <b>Equipe:</b> ${task.team}<br>
        <b>Equipamentos:</b> ${equipmentsText}<br>
        <b>Início:</b> ${task.begin}<br>
        <b>Fim:</b> ${task.end}<extra></extra>
      `,
    };
  });

  return (
    <div className="gantt-container">
      <Plot
        data={formattedData}
        layout={{
          autosize: true,
          height: 263,
          margin: { l: 150, r: 20, t: 20, b: 40 },
          barmode: 'stack',
          showlegend: false,
          yaxis: {
            type: 'category',
            categoryorder: 'array',
            categoryarray: uniqueOperations,
            automargin: true,
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: '#EDEDED',
          },
          xaxis: {
            type: 'date',
            tickformat: '%H:%M',
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: '#EDEDED',
          },
          plot_bgcolor: '#FFFFFF',
          paper_bgcolor: '#FFFFFF',
        }}
        config={{ responsive: true }}
      />
    </div>
  );
}

export default GanttChart;