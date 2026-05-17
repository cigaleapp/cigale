The naive solution was not performant at all, so I implemented a set-based approach that pre-computes per-species sets of cascaded metadata options.

Here's the little writeup that goes through my "research"

Let $\mathcal{ S }$ a dictionary of dictionnaries of options as defined below: ($(k, v) \in \mathcal{S}$ means iterating over (key, value) _pairs_ of the dictionary)

| keys ↓    | metadata A        | metadata B                 | metadata C              | metadata D              | $\cdots$ |
| --------- | ----------------- | -------------------------- | ----------------------- | ----------------------- | -------- |
| species 1 | $\{ \alpha_A \} $ | $\{ \beta_B, \delta_B \} $ | $\{ \alpha_C \} $       | $\overline{\emptyset} $ | $\cdots$ |
| species 2 | $\{ \beta_A \} $  | $\{ \gamma_B \} $          | $\overline{\emptyset} $ | $\{ \delta_C \} $       | $\cdots$ |
| $\cdots$  | $\cdots$          | $\cdots$                   | $\cdots$                | $\cdots$                | $\ddots$ |

with

- $\{ \alpha_M, \beta_M, \ldots \}$ being $M$'s options, for any metadata $M$;
- species $n$ being the focused metadata's narrowable options

computed once (in `(options)` route group's layout), possibly in a swarpc procedure

then:

## matching

Let

$$
\text{matches}(C) = \{ (s, o) \in \mathcal{S} \mid \forall {m \in \mathcal{M}}, o_m \cap C_m \neq \emptyset \}
$$

with:

- $C$ the set of selected options ( $C \in \mathcal{P}(\{ \alpha_A, \beta_A, \ldots, \alpha_B, \beta_B, \ldots \})$ ),
- $\mathcal{M}$ the set of metadata all metadata,
- $i_m$ filtering a set of options $i$, keeping only options of metadata $m$

This gives us the species (elements of $\mathcal{S}$) that match the picked set of options $C$. Crucially, species that don't have a cascade of a given metadata have $\overline{\emptyset}$ joined to their set in $\mathcal{S}$, **not** $\emptyset$. This means adding all possible options of the metadata.[^1]

[^1]: We could also do the empty set, but in that case the backbone protocol _has_ to specify a full-set cascade for every empty case. Empty set could mean that a species matches with _no_ option of a metadata (instead of just meaning "we don't care about that metadata, it could be anything)

## ordering

We define the _narrowing power_ $\text{npow}_S(m)$ of a given metadata $m$ under candidates $S$ as the following:

$$
\text{npow}_S(m) = \underset{o \in  \overline{\emptyset}}{\text{avg}} \ \, \text{card} \{  (s, o') \in S \mid o \in o' \}
$$

with $S \subset \mathcal{S}$, in practice we'll have $S = \text{matches}(C)$ with $C$ changing as we pick options.

This is basically a metadata's average (averaging over its options, $\overline{\emptyset}$) amount of species left after picking any of its options: we start with the available options (so, $S$) and filter by those that intersect with the metadata's possible options.

Then:

```ts
const ordering = definitions.toSorted(compareBy((def) => npow(matches, def)));
```
