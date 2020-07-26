<script>
  import { Router } from '@sveltech/routify';
  import { routes } from '@sveltech/routify/tmp/routes';
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
  <div class="mr-3">
    <a
      class="github-button"
      href="https://github.com/vbstreetz/crypto-bet"
      aria-label="Star vbstreetz/coin-price-bet on GitHub"
      target="_blank">
      Star
    </a>
  </div>
</div>
<Router {routes} />
