<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import Chart from 'chart.js';

  const color = '#777';

  export let x = [];
  export let y = [];
  export let xLabel = '';
  export let yLabel = '';
  export let type = 'line';

  //  The Chart returned from chart.js
  let chart = null;

  //  DOM node for chart.js to latch onto
  let chartRef;

  onMount(() => {
    chart = new Chart(chartRef.getContext('2d'), {
      type,
      data: {
        labels: xLabel,
        datasets: [
          {
            label: yLabel,
            data: y,
            backgroundColor: color,
            borderColor: color,
            fill: false,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false,
          onClick: function (e) {
            e.stopPropagation();
          },
        },
        scales: {
          xAxes: [{ gridLines: {}, ticks: { fontColor: color } }],
          yAxes: [
            { gridLines: {}, ticks: { fontColor: color, beginAtZero: true } },
          ],
        },
      },
    });
    chart.canvas.parentNode.style.height = '400px';
  });

  //  Update the chart when incoming data changes
  afterUpdate(() => {
    chart.data.labels = x;
    chart.data.datasets[0].data = y;
    chart.update();
  });

  //  Mark Chart references for garbage collection when component is unmounted
  onDestroy(() => {
    chart = null;
  });
</script>

<canvas bind:this={chartRef} />
