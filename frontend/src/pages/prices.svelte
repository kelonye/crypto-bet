<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Chart from '../components/chart.svelte';
  import { COINS } from '../config';
  import { fromDaiWei } from '../utils';
  import { betContract, load, address } from '../stores/blockchain';

  let currentCoinSymbol = COINS[0];
  let chartX;
  let chartY;
  let loaded = false;

  function switchChart(event) {
    const { coin } = event.target.dataset;
    currentCoinSymbol = COINS[parseInt(coin)];
    fetchData(coin);
  }

  async function fetchData(coin = 0) {
    // const prices = await blockchain.query(`/coinpricebet/today-coin-prices/${coin}`);
    // chartX = new Array(prices.length).fill(0);
    // chartY = prices.map((s) => fromDaiWei(parseInt(s)));
  }

  async function recordPrice() {
    console.log(
      await betContract.write('saveCurrentDayRankingFromChainlink', [], {
        from: get(address),
      })
    );
  }

  onMount(async function() {
    await load();
    await fetchData();
    loaded = true;
  });
</script>

<style>
  .heading {
    margin-bottom: 30px;
  }

  .dropdown-icon polyline {
    stroke: #eee !important;
  }

  :global(.dark) .dropdown-item:hover {
    background: inherit;
    opacity: 0.8;
  }

  :global(.dark) .dropdown-item {
    color: white;
  }

  .chart-container {
    background: #424242;
    border-radius: 2px;
  }
</style>

<div class="flex flex-col">
  <div class="heading">
    <div class="flex">
      <h3 class="flex-grow">Today's Price Performance</h3>

      <button class="button is-light is-small ml-2" on:click={recordPrice}>
        RECORD
      </button>
    </div>
  </div>

  <div class="flex flex-col">
    <div class="dropdown is-hoverable">
      <div class="dropdown-trigger cursor-pointer">
        <div
          aria-haspopup="true"
          aria-controls="dropdown-menu"
          class="flex items-center">
          <span>{currentCoinSymbol}</span>
          <span class="icon is-small dropdown-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 512 512">
              <title>ionicons-v5-a</title>
              <polyline
                points="112 184 256 328 400 184"
                style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px" />
            </svg>
          </span>
        </div>

      </div>
      <div class="dropdown-menu" id="draw-dropdown-menu" role="menu">
        <div class="dropdown-content">
          {#each COINS as coin, id}
            <a
              class="dropdown-item"
              href="javascript:"
              data-coin={id}
              on:click={switchChart}>
              {coin}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="chart-container mt-4 p-5 pt-10">
    {#if chartX && chartY}
      <Chart x={chartX} y={chartY} yLabel="USD" type="line" />
    {/if}
  </div>
</div>
