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
  // Verificar se há dados
  if (!data || data.length === 0) {
    return (
      <div className="gantt-container">
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          Nenhum dado disponível para o gráfico Gantt
        </div>
      </div>
    );
  }

  // Debug: log dos dados recebidos
  console.log('=== DADOS RECEBIDOS ===');
  console.log('Dados brutos:', data);
  console.log('Total de dados:', data.length);

  // Filtrar dados válidos (com begin e end válidos)
  const validData = data.filter(task => {
    if (!task.begin || !task.end) {
      console.log('Dados inválidos - sem begin/end:', task);
      return false;
    }

    try {
      const beginDate = new Date(task.begin);
      const endDate = new Date(task.end);
      
      if (isNaN(beginDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('Datas inválidas:', { begin: task.begin, end: task.end });
        return false;
      }

      if (beginDate >= endDate) {
        console.log('Data de início >= data de fim:', { begin: task.begin, end: task.end });
        return false;
      }

      return true;
    } catch (error) {
      console.log('Erro ao processar datas:', error, task);
      return false;
    }
  });
  
  console.log('Dados válidos após validação:', validData.length);

  if (validData.length === 0) {
    return (
      <div className="gantt-container">
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          Dados de horário não disponíveis ou inválidos
        </div>
      </div>
    );
  }

  // Criar mapa de equipes
  const teamsMap: Record<string, GanttTask[]> = {};

  validData.forEach(task => {
    // Garantir que o nome da equipe seja válido
    const teamName = task.team && task.team.trim() !== '' ? task.team : 'Sem equipe';
    
    if (!teamsMap[teamName]) {
      teamsMap[teamName] = [];
    }
    teamsMap[teamName].push(task);
  });

  console.log('=== MAPA DE EQUIPES ===');
  console.log('Equipes encontradas:', Object.keys(teamsMap));
  Object.entries(teamsMap).forEach(([team, tasks]) => {
    console.log(`Equipe ${team}: ${tasks.length} tarefas`);
  });

  // Calcular range de tempo
  const allTimes = validData.flatMap(t => {
    try {
      return [new Date(t.begin).getTime(), new Date(t.end).getTime()];
    } catch (error) {
      console.log('Erro ao converter tempo:', error, t);
      return [];
    }
  }).filter(time => !isNaN(time));

  if (allTimes.length === 0) {
    return (
      <div className="gantt-container">
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          Erro ao processar horários das tarefas
        </div>
      </div>
    );
  }

  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);

  console.log('Range de tempo:', {
    min: new Date(minTime).toISOString(),
    max: new Date(maxTime).toISOString(),
    duration: maxTime - minTime
  });

  // Criar dados formatados para Plotly
  const formattedData: any[] = [];

  Object.entries(teamsMap).forEach(([team, tasks], teamIndex) => {
    const color = COLORS[teamIndex % COLORS.length];
    
    // Criar uma barra para cada tarefa da equipe
    tasks.forEach((task, taskIndex) => {
      try {
        const startTime = new Date(task.begin).getTime();
        const endTime = new Date(task.end).getTime();
        const duration = endTime - startTime;

        console.log(`Criando barra para ${team} - ${task.task}:`, {
          start: new Date(startTime).toISOString(),
          end: new Date(endTime).toISOString(),
          duration: duration / 1000 / 60 // em minutos
        });

        formattedData.push({
          type: 'bar',
          orientation: 'h',
          x: [duration],
          base: startTime,
          y: [team],
          width: 0.4,
          marker: { color },
          name: `${task.task} (${task.operation})`,
          hoverinfo: 'text',
          hovertemplate: `
<b>Equipe</b>: ${team}<br><br>
<b>Tarefa</b>: ${task.task}<br><br>
<b>Operação</b>: ${task.operation}<br><br>
<b>Equipamentos</b><br> * ${task.equipments.join(', ') || 'Sem equipamentos'}<br><br>
<b>Início</b>: ${formatDateTime(startTime)}<br>
<b>Fim</b>: ${formatDateTime(endTime)}
<extra></extra>
          `.trim()
        });
      } catch (error) {
        console.log('Erro ao criar barra:', error, task);
      }
    });
  });

  console.log('=== DADOS FINALIZADOS ===');
  console.log('Total de barras criadas:', formattedData.length);
  console.log('Dados para Plotly:', formattedData);

  // Ticks formatados no eixo X
  const tickVals: number[] = [];
  const tickTexts: string[] = [];
  const tickStep = Math.max((maxTime - minTime) / 5, 1000); // mínimo 1 segundo
  
  for (let t = minTime; t <= maxTime; t += tickStep) {
    tickVals.push(t);
    tickTexts.push(new Date(t).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));
  }

  // Adicionar o último tick se necessário
  if (tickVals[tickVals.length - 1] !== maxTime) {
    tickVals.push(maxTime);
    tickTexts.push(new Date(maxTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));
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
            categoryarray: Object.keys(teamsMap),
            automargin: true,
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: '#EDEDED',
            title: 'Equipes',
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