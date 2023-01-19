<script>
  export let users;

  if (users.length > 0) {
    console.log("repro.svelte::users more than 0!");
  } else {
    console.log("repro.svelte::users less than 0!");
  }
</script>

<ul>
  {#each users as user}
    <li>{user}</li>
  {/each}

  {#if users.length === 0}
    <p>No users available</p>
  {/if}
</ul>
