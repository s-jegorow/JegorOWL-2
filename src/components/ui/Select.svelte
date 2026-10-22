<script lang="ts" generics="T extends string">
  interface Props {
    label: string;
    value: T;
    options: { value: T; label: string }[];
  }

  let { label, value = $bindable(), options }: Props = $props();
</script>

<label>
  {label}
  <select bind:value>
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</label>

<style>
  label {
    display: block;
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
  }
</style>
