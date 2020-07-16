<script>
  import { onMount } from 'svelte';
  import moment from 'moment';

  let till = moment.utc().endOf('day');
  let [h, m, s] = duration();

  onMount( () => {
    const interval = setInterval(() => {
      [h, m, s] = duration();
    }, 1000);
    return () => clearInterval(interval);
  });

  function duration() {
    const d = moment.duration(moment.utc(till).diff(moment.utc()));
    return [
      Math.floor(d.asHours()),
      Math.floor(d.asMinutes() % 60),
      Math.floor(d.asSeconds() % 60)
    ];
  }
</script>

<style>
  p {
    font-size: 1.8rem;
  }
</style>

<p>
  <span>{h}h </span>
  <span>{m}m </span>
  <span>{s}s</span>
</p>







