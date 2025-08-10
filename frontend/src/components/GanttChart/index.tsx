import './styles.css';
import Plot from 'react-plotly.js';

export interface GanttTask {
  operation: string;
  task: string;
  equipments: string[];
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

function formatDateTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function GanttChart({ data }: GanttChartProps) {
  const operationsMap: Record<string, GanttTask[]> = {};

  data.forEach(task => {
    if (!operationsMap[task.operation]) {
      operationsMap[task.operation] = [];
    }
    operationsMap[task.operation].push(task);
  });

  const allTimes = data.flatMap(t => [new Date(t.begin).getTime(), new Date(t.end).getTime()]);
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);

  const formattedData = Object.entries(operationsMap).map(([operation, tasks], index) => {
    const taskList = Array.from(new Set(tasks.map(t => t.task))).join(', ');
    const teamList = Array.from(new Set(tasks.map(t => t.team))).join(', ');
    const equipmentList = Array.from(new Set(tasks.flatMap(t => t.equipments))).join(', ') || 'Sem equipamentos';

    const startTimes = tasks.map(t => new Date(t.begin).getTime());
    const endTimes = tasks.map(t => new Date(t.end).getTime());

    let startMin = Math.min(...startTimes);
    let endMax = Math.max(...endTimes);
    const duration = endMax - startMin;

    if (duration <= 0) endMax = startMin + 1000;

    const color = COLORS[index % COLORS.length];

    return {
      type: 'bar',
      orientation: 'h',
      x: [duration],
      base: startMin,
      y: [operation],
      width: 0.4,
      marker: { color },
      hoverinfo: 'text',
      hovertemplate: `
<b>Operação</b>: ${operation}<br><br>
<b>Tarefas</b><br> * ${taskList}<br><br>
<b>Equipes</b><br> * ${teamList}<br><br>
<b>Equipamentos</b><br> * ${equipmentList}<br><br>
<b>Início</b>: ${formatDateTime(startMin)}<br>
<b>Fim</b>: ${formatDateTime(endMax)}
<extra></extra>
      `.trim()
    };
  });

  // Ticks formatados no eixo X
  const tickVals: number[] = [];
  const tickTexts: string[] = [];
  const tickStep = (maxTime - minTime) / 5;
  for (let t = minTime; t <= maxTime; t += tickStep) {
    tickVals.push(t);
    tickTexts.push(new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

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
          hovermode: 'closest',
          hoverlabel: {
            bgcolor: 'auto',
            font: {
              size: 12,
              color: '#fff'
            },
            align: 'left',
          },
          yaxis: {
            type: 'category',
            categoryorder: 'array',
            categoryarray: Object.keys(operationsMap),
            automargin: true,
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: '#EDEDED',
          },
          xaxis: {
            type: 'linear',
            tickvals: tickVals,
            ticktext: tickTexts,
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: '#EDEDED',
            title: 'Horário',
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