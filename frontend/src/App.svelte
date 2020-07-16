<script>
  import {Router} from "@sveltech/routify";
  import {routes} from "@sveltech/routify/tmp/routes";
</script>

<style>
  .topbar {
    padding: 20px 0;
  }
  .link {
    color: #888;
  }
  .link:visited,
  .link:hover {
    opacity: 0.6;
  }
</style>

<div class="topbar flex justify-end text-xs">
  <a class="mr-3 link" href="/">bet</a>
  <a class="mr-3 link" href="/prices">prices</a>

  <div class="mr-3">
    <a class="github-button"
      href="https://github.com/vbstreetz/coin-price-bet"
      aria-label="Star vbstreetz/coin-price-bet on GitHub"
      target="_blank">Star</a>
  </div>

  <a
    class="twitter-follow-button"
    href="https://twitter.com/coin_price_bet?ref_src=twsrc%5Etfw"
    data-show-count="false"
    target="_blank">Follow @coin_price_bet</a>
</div>
<Router {routes}/>
