<script>

</script>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
  }

  .throbber {
    animation: throbber 1s infinite ease-in-out;
    -webkit-animation: throbber 1s infinite ease-in-out;
    animation-delay: -0.16s;
    -webkit-animation-delay: -0.16s;
    background: #999;
    color: #999;
    font-size: 6px;
    height: 20px;
    position: relative;
    text-indent: -9999em;
    transform: translateZ(0);
    -ms-transform: translateZ(0);
    -webkit-transform: translateZ(0);
    width: 1em;
  }

  .throbber:before {
    animation: throbber 1s infinite ease-in-out;
    -webkit-animation: throbber 1s infinite ease-in-out;
    animation-delay: -0.32s;
    -webkit-animation-delay: -0.32s;
    background: #999;
    content: '';
    height: 20px;
    left: -1.5em;
    position: absolute;
    top: 0;
    width: 1em;
  }

  .throbber:after {
    animation: throbber 1s infinite ease-in-out;
    -webkit-animation: throbber 1s infinite ease-in-out;
    animation-delay: 0.08s;
    -webkit-animation-delay: 0.08s;
    background: #999;
    content: '';
    height: 20px;
    left: 1.5em;
    position: absolute;
    top: 0;
    width: 1em;
  }

  @keyframes throbber {
    0%,
    80%,
    100% {
      box-shadow: 0 0;
      height: 20px;
    }
    40% {
      box-shadow: 0 -2em;
      height: 5em;
    }
  }

  @-webkit-keyframes throbber {
    0%,
    80%,
    100% {
      box-shadow: 0 0;
      height: 20px;
    }
    40% {
      box-shadow: 0 -2em;
      height: 5em;
    }
  }
</style>

<div class="container">
  <div class="throbber" />
</div>
