import os
import matplotlib.pyplot as plt

def plot_gantt(schedule, filename="media/gantt.png"):
    machines = sorted(set(op['machine'] for op in schedule))
    machine_to_y = {m: i for i, m in enumerate(machines)}

    # 95% de 652px x 360px => ~619 x 342 pixels. Como 100 DPI = 1 inch = 100px,
    # então usamos: 6.19in x 3.42in
    fig, ax = plt.subplots(figsize=(6.19, 3.42), dpi=100)

    for op in schedule:
        start = op["start"]
        duration = op["duration"]
        machine = op["machine"]
        y = machine_to_y[machine]

        ax.barh(y, duration, left=start, height=0.4, align='center', edgecolor='black')
        ax.text(start + duration / 2, y, f"{op['job']}",
                va='center', ha='center', color='white', fontsize=9)

    ax.set_yticks(range(len(machines)))
    ax.set_yticklabels([f"Máquina {m}" for m in machines])
    ax.set_xlabel("Tempo")
    ax.set_title("Gráfico de Gantt - Escalonamento JSSP")

    plt.grid(True, axis='x')
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    plt.savefig(filename, bbox_inches='tight')
    plt.close()