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
  // Validação inicial dos dados recebidos
  console.log('=== 🔍 VALIDAÇÃO INICIAL DOS DADOS ===');
  console.log('📊 Dados brutos recebidos:', data);
  console.log('📏 Total de dados:', data.length);
  console.log('🔍 Estrutura do primeiro item:', data[0]);
  
  if (data.length === 0) {
    console.log('⚠️ AVISO: Nenhum dado recebido para plotagem');
    return <div className="gantt-container">Nenhum dado disponível para plotagem</div>;
  }

  // Validação de estrutura dos dados
  const dadosValidos = data.filter(item => {
    const valido = item && 
                   typeof item === 'object' && 
                   item.team && 
                   item.task && 
                   item.begin && 
                   item.end;
    
    if (!valido) {
      console.log('❌ Item inválido encontrado:', item);
    }
    return valido;
  });

  console.log('✅ Dados válidos após validação:', dadosValidos.length);
  console.log('❌ Dados inválidos removidos:', data.length - dadosValidos.length);

  if (dadosValidos.length === 0) {
    console.log('🚨 ERRO: Nenhum dado válido encontrado após validação');
    return <div className="gantt-container">Dados de horário não disponíveis ou inválidos</div>;
  }

  // Criar mapa de equipes
  const teamsMap: Record<string, GanttTask[]> = {};

  console.log('\n=== 🏗️ CRIAÇÃO DO MAPA DE EQUIPES ===');
  
  dadosValidos.forEach((task, index) => {
    // Garantir que o nome da equipe seja válido
    const teamName = task.team && task.team.trim() !== '' ? task.team : 'Sem equipe';
    
    if (!teamsMap[teamName]) {
      teamsMap[teamName] = [];
      console.log(`🏗️ Nova equipe criada: "${teamName}"`);
    }
    
    teamsMap[teamName].push(task);
    console.log(`📋 Tarefa ${index + 1} adicionada à equipe "${teamName}": ${task.task}`);
  });

  console.log('\n=== 📊 MAPA DE EQUIPES FINALIZADO ===');
  console.log('Total de equipes:', Object.keys(teamsMap).length);
  Object.entries(teamsMap).forEach(([team, tasks]) => {
    console.log(`🏢 ${team}: ${tasks.length} tarefas`);
    tasks.forEach((task, index) => {
      console.log(`  📋 Tarefa ${index + 1}: ${task.task} (${task.operation}) - ${task.begin} até ${task.end}`);
    });
  });

  // Calcular range de tempo
  console.log('\n=== ⏰ CÁLCULO DO RANGE DE TEMPO ===');
  
  const allTimes = dadosValidos.flatMap(t => {
    try {
      const beginTime = new Date(t.begin).getTime();
      const endTime = new Date(t.end).getTime();
      
      if (isNaN(beginTime) || isNaN(endTime)) {
        console.log(`⚠️ AVISO: Datas inválidas para tarefa ${t.task}: begin=${t.begin}, end=${t.end}`);
        return [];
      }
      
      console.log(`⏰ Tarefa ${t.task}: ${new Date(beginTime).toISOString()} até ${new Date(endTime).toISOString()}`);
      return [beginTime, endTime];
    } catch (error) {
      console.log(`❌ ERRO ao processar datas da tarefa ${t.task}:`, error);
      return [];
    }
  });

  if (allTimes.length === 0) {
    console.log('🚨 ERRO: Nenhum tempo válido encontrado');
    return <div className="gantt-container">Erro ao processar horários das tarefas</div>;
  }

  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const duration = maxTime - minTime;

  console.log('📊 Range de tempo calculado:');
  console.log(`  🕐 Início: ${new Date(minTime).toISOString()}`);
  console.log(`  🕐 Fim: ${new Date(maxTime).toISOString()}`);
  console.log(`  ⏱️ Duração total: ${duration / 1000 / 60} minutos`);

  // Criar dados formatados para Plotly
  const formattedData: any[] = [];

  console.log('\n=== 🎨 CRIAÇÃO DAS BARRAS DO GRÁFICO ===');
  console.log('Total de equipes para processar:', Object.keys(teamsMap).length);

  Object.entries(teamsMap).forEach(([team, tasks], teamIndex) => {
    const color = COLORS[teamIndex % COLORS.length];
    
    console.log(`\n🎨 Processando equipe: ${team} (índice: ${teamIndex}, cor: ${color})`);
    console.log(`📋 Total de tarefas da equipe: ${tasks.length}`);
    
    // Criar uma barra para cada tarefa da equipe
    tasks.forEach((task, taskIndex) => {
      try {
        const startTime = new Date(task.begin).getTime();
        const endTime = new Date(task.end).getTime();
        const duration = endTime - startTime;

        console.log(`  📊 Criando barra ${taskIndex + 1}/${tasks.length} para ${team}:`);
        console.log(`    🏷️ Nome: ${task.task}`);
        console.log(`    🏭 Operação: ${task.operation}`);
        console.log(`    🕐 Início: ${new Date(startTime).toISOString()}`);
        console.log(`    🕐 Fim: ${new Date(endTime).toISOString()}`);
        console.log(`    ⏱️ Duração: ${duration / 1000 / 60} minutos`);
        console.log(`    🎨 Cor: ${color}`);

        formattedData.push({
          type: 'bar',
          orientation: 'h',
          x: [duration],
          base: startTime,
          y: [team],
          width: 0.15, // Reduzido para criar espaçamento visual entre tarefas
          marker: { 
            color,
            line: {
              color: '#333333',
              width: 1.5
            }
          },
          name: `${team} - ${task.task} (${task.operation})`,
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
        
        console.log(`    ✅ Barra criada com sucesso!`);
      } catch (error) {
        console.log(`    ❌ ERRO ao criar barra para ${team} - ${task.task}:`, error);
      }
    });
  });

  console.log('\n=== 🎯 DADOS FINALIZADOS PARA PLOTLY ===');
  console.log('📊 Total de barras criadas:', formattedData.length);
  console.log('🏢 Total de equipes:', Object.keys(teamsMap).length);
  console.log('📋 Total de tarefas processadas:', dadosValidos.length);
  
  // Validação final dos dados
  console.log('\n=== 🔍 VALIDAÇÃO FINAL DOS DADOS ===');
  formattedData.forEach((barra, index) => {
    console.log(`Barra ${index + 1}:`, {
      equipe: barra.y[0],
      nome: barra.name,
      duracao: barra.x[0],
      inicio: new Date(barra.base).toISOString(),
      fim: new Date(barra.base + barra.x[0]).toISOString(),
      cor: barra.marker.color
    });
  });

  // Verificar se há barras duplicadas por equipe
  const barrasPorEquipe: Record<string, number> = {};
  formattedData.forEach(barra => {
    const equipe = barra.y[0];
    barrasPorEquipe[equipe] = (barrasPorEquipe[equipe] || 0) + 1;
  });

  console.log('\n=== 📊 RESUMO DE BARRAS POR EQUIPE ===');
  Object.entries(barrasPorEquipe).forEach(([equipe, quantidade]) => {
    console.log(`🏢 ${equipe}: ${quantidade} barras`);
  });

  console.log('\n=== 🚀 ENVIANDO DADOS PARA PLOTLY ===');
  console.log('Dados completos:', formattedData);

  // Ticks formatados no eixo X
  const tickVals: number[] = [];
  const tickTexts: string[] = [];
  const tickStep = Math.max((maxTime - minTime) / 5, 1000); // mínimo 1 segundo
  
  console.log('\n=== ⏰ CONFIGURAÇÃO DOS TICKS DO EIXO X ===');
  console.log(`Passo dos ticks: ${tickStep / 1000} segundos`);
  
  for (let t = minTime; t <= maxTime; t += tickStep) {
    tickVals.push(t);
    const tickText = new Date(t).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    tickTexts.push(tickText);
    console.log(`Tick ${tickVals.length}: ${new Date(t).toISOString()} -> "${tickText}"`);
  }

  // Adicionar o último tick se necessário
  if (tickVals[tickVals.length - 1] !== maxTime) {
    tickVals.push(maxTime);
    const lastTickText = new Date(maxTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    tickTexts.push(lastTickText);
    console.log(`Tick final: ${new Date(maxTime).toISOString()} -> "${lastTickText}"`);
  }

  console.log(`\n=== 🎨 CONFIGURAÇÃO FINAL DO LAYOUT ===`);
  console.log(`Altura do gráfico: ${Math.max(300, Object.keys(teamsMap).length * 35)}px`);
  console.log(`Margem esquerda: 180px (para nomes das equipes)`);
  console.log(`Margem direita: 30px`);
  console.log(`Margem superior: 30px`);
  console.log(`Margem inferior: 50px`);
  console.log(`Modo das barras: overlay`);
  console.log(`Largura das barras: 0.15 (reduzida para melhor separação)`);
  console.log(`Bordas das barras: #333333, 1.5px`);
  console.log(`Total de ticks no eixo X: ${tickVals.length}`);

  return (
    <div className="gantt-container">
      <Plot
        data={formattedData}
        layout={{
          autosize: true,
          height: Math.max(300, Object.keys(teamsMap).length * 35), // Aumentado para melhor espaçamento
          margin: { l: 180, r: 30, t: 30, b: 50 }, // Margens aumentadas para melhor visualização
          barmode: 'overlay', // Mantido para mostrar barras individuais
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
            tickfont: { size: 13, color: '#333' }, // Fonte maior e mais escura
            showgrid: true,
            gridcolor: '#E0E0E0', // Grid mais visível
            gridwidth: 1,
            title: {
              text: 'Equipes',
              font: { size: 14, color: '#333' }
            },
            tickmode: 'array',
            ticktext: Object.keys(teamsMap),
            tickvals: Object.keys(teamsMap),
            ticklen: 8, // Ticks mais longos para melhor visualização
            tickwidth: 2,
            tickcolor: '#666',
          },
          xaxis: {
            type: 'linear',
            tickvals: tickVals,
            ticktext: tickTexts,
            tickfont: { size: 12, color: '#333' },
            showgrid: true,
            gridcolor: '#E0E0E0', // Grid mais visível
            gridwidth: 1,
            title: {
              text: 'Horário',
              font: { size: 14, color: '#333' }
            },
            zeroline: false,
          },
          plot_bgcolor: '#FAFAFA', // Fundo ligeiramente colorido para melhor contraste
          paper_bgcolor: '#FFFFFF',
          font: {
            family: 'Arial, sans-serif',
            size: 12,
            color: '#333'
          }
        }}
        config={{ responsive: true }}
      />
    </div>
  );
}

export default GanttChart;