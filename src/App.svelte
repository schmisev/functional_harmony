<script>
	import * as cl from './chordLogic.js';

	let wniSelect = 0;
	let miSelect = 0;

	let showModeNames = true;
	let showHeader = true;
	let showRoman = true;

	let modeMatrix = cl.generateModeMatrix(0, 0);

	$: modeMatrix = cl.generateModeMatrix(parseInt(wniSelect), parseInt(miSelect));
</script>

<h1>~ modes ~</h1>

<div class="global">
<!-- Note selection -->
<select bind:value={wniSelect}>
{#each cl.WHOLE_NOTE_SELECT as [n, v]}
	<option value={v}>{n}</option>
{/each}
</select>

<!-- Mod selection -->
<select bind:value={miSelect}>
{#each cl.MOD_SELECT as [n, v]}
	<option value={v}>{n}</option>
{/each}
</select>

<!-- Mode table -->
<table class="modes">
{#if showHeader}
<tr>
{#if showModeNames}
	<th>MODES</th>
{/if}

{#each cl.ROMAN_NOTES as rn}
	<th>{rn}</th>
{/each}
</tr>
{/if}

{#each modeMatrix as mode}
	<tr>
	{#if showModeNames}
	<td class="mode"><b>{mode.name[0]}</b></td>
	{/if}
	{#each mode.chordScale as chord}
	<td>
		<table class="chord">
			<tr>
				<td class="chord">
					<span class="note"><b>{chord.wholeNote}<sup>{chord.mod}</sup></b></span><span class="chord">{chord.possibleChords[0]}</span>
				</td>
			</tr>
			<tr>
				{#if showRoman}
				<td class="roman">
					<span class="roman"><b>{chord.secRoman}</b></span>
				</td>
				{/if}
			</tr>
		</table>
	</td>
	{/each}
	</tr>
{/each}
</table>

<!-- Hide modes -->
<p>
<span class="check"><input type=checkbox bind:checked={showModeNames}> show mode names</span>
<span class="check"><input type=checkbox bind:checked={showHeader}> show header</span>
<span class="check"><input type=checkbox bind:checked={showRoman}> show numerals</span>
</p>
</div>

<div class="global">

</div>

<style>
	div.global {
		font-family: 'Consolas', Courier, monospace;
		text-align: center;
	}

	h1 {
		text-align: center;
		color: #e95280;
	}

	table.modes {
		width: 100%;
		border: 2px solid lightgray;
		border-radius: 5px;
	}

	table.chord {
		background-color: whitesmoke;
		width: 100%;
		box-sizing: border-box;
		border-collapse: collapse;
	}

	td.chord {
		width: 50%;
		box-sizing: border-box;
		text-align: center;
		border: 2px solid lightgray;
	}

	td.roman {
		width: 50%;
		box-sizing: border-box;
		text-align: center;
		border: 2px dashed lightgray;
		color: gray;
	}

	th {
		box-sizing: border-box;
		text-align: center;
		border: 2px solid #23b1a5;
		color: #ffdd7e;
		background-color: #23b1a5;
	}

	td.mode {
		box-sizing: border-box;
		text-align: center;
		border: 2px solid #e95280;
		color: #f3f3f3;
		background-color: #e95280;
	}

	td, th {
		text-align: center;
	}

	span.check {
		padding: 0.5rem;
		color: gray;
	}

	select {
		padding: 0.5rem;
		border: 2px solid lightgray;
		color: gray;
	}
</style>