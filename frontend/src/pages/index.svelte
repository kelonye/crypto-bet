<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import moment from 'moment';
  import Day from '../components/day.svelte';
  import {
    address,
    info,
    myInfo,
    balance,
    load,
    loadBalance,
    disconnectAccount,
    connectAccount,
    betContract,
    networkInfo,
  } from '../stores/blockchain';
  import { fromDaiWei, toDaiWei, sl, sleep, autoReload } from '../utils';

  const tomorrow = moment.utc();
  const today = moment.utc().subtract(1, 'days');
  const yesterday = moment.utc().subtract(2, 'days');
  const days = [
    { label: 'Tomorrow', date: tomorrow },
    { label: 'Today', date: today },
    { label: 'Yesterday', date: yesterday },
  ];
  let loaded = false;
  let addressUnSubscriber;
  let betPlacedUnSubscriber;

  onMount(() => {
    addressUnSubscriber = address.subscribe(async () => {
      await load();

      if (get(networkInfo).networkSupported && !loaded) {
        betPlacedUnSubscriber = betContract.on('BetPlaced', loadBalance);
      }

      loaded = true;
    });
    autoReload(() => {
      window.reload();
    });
  });

  onDestroy(() => {
    addressUnSubscriber();
    betPlacedUnSubscriber && betPlacedUnSubscriber();
  });

  async function recordPrice() {
    console.log(
      await betContract.write('saveCurrentDayRankingFromChainlink', [], {
        from: get(address),
      })
    );
  }
</script>

<style>
  .main-heading {
    font-weight: bolder;
    margin-left: 50px;
  }

  .main-container {
    margin-top: 50px;
    padding: 30px 16px 16px 0;
    position: relative;
  }

  .main-container:before {
    right: auto;
    left: 47px;
    background: var(--border-color);
    bottom: 0;
    content: '';
    height: 100%;
    position: absolute;
    top: 0;
    width: 1px;
  }

  .error {
    color: red;
  }
</style>

{#if loaded}
  <div class="dark">
    <!-- todo: find out why purgecss doesn't look up html.dark -->
    <div class="flex">
      <h1 class="main-heading flex-grow">
        BET TODAY,
        <br />
        THE BEST CRYPTO OF TOMORROW, AND WIN!
      </h1>

      {#if $address}
        <div class="flex flex-col text-sm">
          <div class="mr-3">Account: {$address}</div>
          <table class="balances">
            <tr>
              <td>Balances:</td>
              <td>{fromDaiWei($balance)}DAI</td>
            </tr>
            <!--
            {#if $myInfo}
              <tr>
                <td>Total Bets:</td>
                <td>{fromDaiWei($myInfo.totalBetsAmount)}DAI</td>
              </tr>
              <tr>
                <td>Total Wins:</td>
                <td>{fromDaiWei($myInfo.totalWinsAmount)}DAI</td>
              </tr>
            {/if}
            -->
          </table>
        </div>
        <button class="button is-light is-small ml-2" on:click={loadBalance}>
          REFRESH BALANCE
        </button>
        {#if 'localhost' === window.location.hostname}
          <button class="button is-light is-small ml-2" on:click={recordPrice}>
            RECORD
          </button>
        {/if}
        <!--
          <button
          class="button is-light is-small ml-2"
          on:click={disconnectAccount}>
          DISCONNECT
        </button>
        -->
      {:else}
        <button class="button is-light is-small" on:click={connectAccount}>
          CONNECT TO METAMASK
        </button>
      {/if}
    </div>

    {#if !$networkInfo.networkSupported}
      <div class="flex flex-grow justify-center mt-10 error">
        Unsupported network ({$networkInfo.networkName}). Please use Rinkeby.
      </div>
    {:else if info}
      <div class="main-container">
        {#each days as day}
          {#if $info}
            <Day day={day.date} label={day.label} />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
