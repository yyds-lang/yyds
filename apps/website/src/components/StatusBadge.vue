<script setup lang="ts">
const props = defineProps<{
  status: 'idle' | 'loading' | 'success' | 'error'
  text: string
}>()

const colorClass = computed(() => {
  if (props.status === 'loading') {
    return 'border-blue-400/40 bg-blue-500/10 text-blue-200'
  }
  if (props.status === 'success') {
    return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
  }
  if (props.status === 'error') {
    return 'border-rose-400/40 bg-rose-500/10 text-rose-200'
  }
  return 'border-zinc-700 bg-zinc-800 text-zinc-300'
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium"
    :class="colorClass"
  >
    {{ text }}
  </span>
</template>
