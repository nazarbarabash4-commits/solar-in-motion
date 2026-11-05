# Module 6: Game Theory — WU Vienna Study Notes

---

## Overview of Topics

| Section | Content |
|---|---|
| 1 | Definitions & Core Concepts |
| 2 | Static Games (simultaneous) |
| 3 | Dominant Strategies & Nash Equilibrium |
| 4 | Special Games: Prisoner's Dilemma, Multiple Equilibria |
| 5 | Decisions under Uncertainty: Maximin Strategy |
| 6 | Mixed Strategies |
| 7 | Dynamic/Repeated Games |
| 8 | Sequential Games & Backward Induction |
| 9 | Credible Threats |

---

## 1. DEFINITIONS & CORE CONCEPTS

### What is Game Theory?
**Game Theory** is a branch of mathematics that studies the behavior of **rational actors** in **strategic situations** — systems of interaction where the strategies of one player affect the outcomes for others.

It is not a single unified theory, but a **collection of analytical tools** applied in economics, computer science, social sciences, and psychology.

**Origin:** John von Neumann (1928) → "Theory of Games and Economic Behavior" (1944, with Morgenstern) → Nash Equilibrium (1949, Nash).

---

### Key Definitions

**Game:** A situation in which agents (players) make strategic decisions that take into account the actions and reactions of other players.

**Strategic:** The actions or reactions of other players must be considered when making decisions.

**Strategy:** A rule or plan of action for each possible situation in the game.

**Optimal strategy:** The strategy that maximizes the individual payoff.

**Payoff:** The value assigned to the best possible outcome (utility or monetary units — e.g., profit levels, market shares).

**Rational players:** Players who (1) know the rules of the game, (2) know the preferences of their opponents, and (3) possess this common knowledge.

---

### Structure of a Game

A game is defined by:
- **Who** are the players (decision-makers)?
- **What** strategies are available?
- **In what order** are moves made?
- **What are the consequences** of each combination of decisions?

| Game element | Market equivalent |
|---|---|
| Players | Firms and consumers |
| Rules (timing, actions, info) | Framework (pricing timing, output ranges, market info) |
| Outcomes (who chose what) | Firm policy: price, output, advertising |
| Payoffs (who wins how much) | Profit levels, market shares |

---

### Mathematical Definition of a Game

A game in **normal (strategic) form** is a triple **(N, S, U)** where:
- **N = {1, 2, ..., n}** — the set of players
- **S = S₁ × S₂ × ... × Sₙ** — all valid strategy combinations; **Sᵢ** = set of strategies available to player i; **s = (s₁, s₂, ..., sₙ)** is a strategy profile
- **U: S → ℝⁿ** — Neumann-Morgenstern utility function; **Uᵢ(s)** = payoff of player i given strategy profile s

**Notation:** s is often split as:
- **sᵢ** = action of player i
- **s₋ᵢ = (s₁, ..., sᵢ₋₁, sᵢ₊₁, ..., sₙ)** = actions of all other players

---

### Types of Games

| Dimension | Option A | Option B |
|---|---|---|
| Timing | Static / Simultaneous | Dynamic / Sequential |
| Strategy type | Pure-strategy equilibrium | Mixed-strategy equilibrium |
| Information | Full information | Limited information |

**Cooperative games:** Players negotiate binding contracts → joint strategies, not purely self-interested.  
**Non-cooperative games:** No possibility to negotiate/enforce binding contracts → each firm optimizes independently (the standard model in oligopoly).

---

## 2. STATIC GAMES (Simultaneous Decisions)

**Static game:** Players choose strategies **simultaneously** (or without knowing the other's choice).

**Representation: Normal form** = a payoff matrix.

**Convention:** Payoff matrix shows (Row player payoff, Column player payoff) in each cell.

**Example payoff matrix:**

|  | Player B: B1 | Player B: B2 |
|---|---|---|
| **Player A: A1** | **10**, 5 | **15**, 0 |
| **Player A: A2** | **6**, 8 | **10**, 2 |

First number = payoff for A, second = payoff for B.

### How to Solve a Static Game (4-step algorithm)

1. **Find all possible strategies** for each player.
2. **Determine payoffs** for each combination.
3. **Find best response** for each player: for each possible move of the opponent, which move gives the highest payoff?
4. **Find Nash equilibrium:** where each player is doing the best they can, given what the others are doing.

---

## 3. DOMINANT STRATEGIES & NASH EQUILIBRIUM

### Dominant Strategy

**Definition:** A strategy that is **optimal no matter what the opponent does** — it is the best response to any action the opponent could take.

- If a player has a dominant strategy, they will always play it.
- If all players have dominant strategies → the Nash equilibrium = everyone plays their dominant strategy.
- A game **without** dominant strategies: the optimal decision depends on what others do → finding NE is more complex.

**How to identify:** For each of your strategies, check if it is always better than the alternative regardless of what the opponent does.

### Nash Equilibrium (NE)

**Formal definition:** A strategy combination **s* = (s₁*, s₂*, ..., sₙ*)** is a Nash equilibrium if for all players i:

> **Uᵢ(sᵢ*, s₋ᵢ*) ≥ Uᵢ(sᵢ, s₋ᵢ*)** for all sᵢ ∈ Sᵢ

In words: **player i cannot improve their payoff by unilaterally changing their strategy.**

For 2 players: s* is NE ⟺
- s₁* is best reply for Player 1 given s₂*
- s₂* is best reply for Player 2 given s₁*

**Key intuition:** "I am doing the best I can, given what you are doing. You are doing the best you can, given what I am doing. **Nobody has an incentive to deviate.**"

**Dominant strategies are a special case of NE:**
- With dominant strategy: "I am doing the best I can, no matter what you do."
- Without dominant strategy: "I am doing the best I can, **given** what you are doing."

---

### Example: Advertising Game

Two firms (A and B) decide whether to advertise.

|  | B: Advertise | B: Don't advertise |
|---|---|---|
| **A: Advertise** | **10**, 5 | **15**, 0 |
| **A: Don't advertise** | 6, **8** | 10, 2 |

**Firm A's analysis:**
- If B advertises: A gets 10 (advertise) vs 6 (don't) → advertise
- If B doesn't advertise: A gets 15 (advertise) vs 10 (don't) → advertise
- **Dominant strategy for A: Advertise**

**Firm B's analysis:**
- If A advertises: B gets 5 (advertise) vs 0 (don't) → advertise
- If A doesn't advertise: B gets 8 (advertise) vs 2 (don't) → advertise
- **Dominant strategy for B: Advertise**

**Nash Equilibrium: (Advertise, Advertise) → payoff (10, 5)**

---

### When There's No Dominant Strategy

**Modified advertising game** (A's payoff in (Don't, Don't) changed to 20):

|  | B: Advertise | B: Don't advertise |
|---|---|---|
| **A: Advertise** | 10, 5 | 15, 0 |
| **A: Don't advertise** | 6, **8** | **20**, 2 |

- B still has a dominant strategy: Advertise (8>2 and 5>0)
- A's optimal choice depends on B: if B advertises → A advertises; if B doesn't → A doesn't advertise
- **No dominant strategy for A** — but since B will always advertise, Nash equilibrium is still (Advertise, Advertise)

---

## 4. SPECIAL GAMES

### 4.1 The Prisoner's Dilemma

**Setup:** Two prisoners, separated, each asked to confess or not. Payoffs (in years of jail, negative = bad):

|  | B: Confess | B: Don't confess |
|---|---|---|
| **A: Confess** | -5, -5 | 0, -10 |
| **A: Don't confess** | -10, 0 | -2, -2 |

**Analysis:**
- If B confesses: A gets -5 (confess) vs -10 (don't) → confess
- If B doesn't confess: A gets 0 (confess) vs -2 (don't) → confess
- **Dominant strategy for both: Confess**
- **NE: (Confess, Confess) → both serve 5 years**

**The Dilemma:** If both cooperated (don't confess), both would serve only 2 years → better for both! But individual rationality leads them to the worse outcome. **Individual rationality ≠ collective optimality.**

**Key lesson:** *If all players choose their dominant strategy, they end up in a Nash equilibrium that is nevertheless inferior to the cooperative outcome.*

---

### 4.2 Prisoner's Dilemma in Pricing (Bertrand Competition)

Firms face the same dilemma with collusion vs. competition:

|  | Firm 1: Compete | Firm 1: Collude |
|---|---|---|
| **Firm 2: Compete** | 25, 25 | 29, 23 |
| **Firm 2: Collude** | 23, 29 | 27, 27 |

- Compete is the dominant strategy for both (if opponent competes: 25>23; if opponent colludes: 29>27)
- **NE: Both compete (25, 25)** — even though (27, 27) from collusion is better for both
- **Collusion is unstable:** each firm has an incentive to undercut and steal customers

**Breaking out of prison — Price leadership:** A "best price guarantee" (like Billa's Bestpreis-Garantie) eliminates the option of undercharging to steal consumers → makes competition the only option → collude becomes the only stable outcome.

---

### 4.3 Multiple Equilibria

**Battle of the Sexes** (Leonard and Penny choose a movie):

|  | Penny: Documentary | Penny: Romantic |
|---|---|---|
| **Leonard: Documentary** | **2, 1** | 0.5, 0.5 |
| **Leonard: Romantic** | 0, 0 | **1, 2** |

- **Two Nash equilibria:** (Documentary, Documentary) and (Romantic, Romantic)
- No dominant strategy for either player
- **Coordination problem:** which equilibrium will they reach?

**Product choice problem** (2 firms, crispy vs sweet cereal):

|  | Firm B: Crispy | Firm B: Sweet |
|---|---|---|
| **Firm A: Crispy** | -5, -5 | **10, 10** |
| **Firm A: Sweet** | **10, 10** | -5, -5 |

- Two NE: (Crispy, Sweet) and (Sweet, Crispy)
- **Coordination problem** — who gets the better product?

---

### 4.4 Location Game (Hotelling's Linear City)

Two firms choose location along a beach (0–200m). Nash equilibrium: both locate at the **center** (100m). Each firm wants to be adjacent to the other to capture the maximum market — the equilibrium is both clustering at the median. Explains why gas stations, fast food chains often cluster together.

---

## 5. DECISIONS UNDER UNCERTAINTY: MAXIMIN STRATEGY

### When to use Maximin?
When opponents may act **irrationally** or decisions must be made with **incomplete information** — you cannot trust the Nash equilibrium logic fully.

### Maximin Strategy Definition
**Maximin strategy:** Choose the strategy that **maximizes the minimum possible payoff** — i.e., choose the **least worst** option (be pessimistic, protect yourself from the worst case).

**Maximax strategy:** Choose the strategy that maximizes the **maximum** possible payoff (optimistic approach).

*Note: Dominant strategies are both maximin AND maximax strategies.*

### Example: Encryption software investment

|  | Firm 2: Don't invest | Firm 2: Invest |
|---|---|---|
| **Firm 1: Don't invest** | 0, 0 | -10, 10 |
| **Firm 1: Invest** | -100, 0 | 20, 10 |

- **Firm 2 has a dominant strategy: Invest** → rational NE: both invest
- **But:** if Firm 1 is not 100% sure Firm 2 will invest, investing is extremely risky (-100 if wrong)
- **Maximin for Firm 1:** Find minimum payoff for each strategy:
  - Don't invest: minimum = -10
  - Invest: minimum = -100
  - Choose **Don't invest** (−10 > −100) → this is the maximin strategy

### Expected Payoff Maximization
If you know the probabilities of opponent's choices, calculate expected payoffs:

> **E[payoff from strategy X] = Σ (probability of opponent's action × your payoff)**

Example (Jana/Marie game, Marie plays Sour with 60% probability):
- E[Jana plays Sweet] = 0.4 × 8 + 0.6 × 10 = **9.2**
- E[Jana plays Sour] = 0.4 × 4 + 0.6 × 9 = **7.0**
- Jana chooses Sweet (9.2 > 7.0)

---

## 6. MIXED STRATEGIES

### Why Mixed Strategies?
Some games have **no Nash equilibrium in pure strategies** — e.g., the coin-toss game:

|  | P2: Head (q) | P2: Tail (1-q) |
|---|---|---|
| **P1: Head (p)** | 1, -1 | -1, 1 |
| **P1: Tail (1-p)** | -1, 1 | 1, -1 |

No pure strategy NE (players want to be unpredictable/opposite of each other). But there is always a **mixed strategy NE**.

**Key fact: Every finite game has at least one Nash equilibrium (possibly in mixed strategies).**

---

### Definition: Mixed Strategy

A **mixed strategy qᵢ** for player i is a **probability distribution** over pure strategies:
- qᵢ(sᵢ) = probability assigned to pure strategy sᵢ
- All probabilities sum to 1: Σ qᵢ(sᵢ) = 1
- **Pure strategy** = special case where one probability = 1, all others = 0
- **Mixed strategy** = genuinely random choice according to chosen probabilities

**Key insight:** "Firms don't choose a ball, they choose a bowl" — they choose the **probability mix** (the bowl/distribution), not the specific action (the ball).

When players don't want to be predictable (opposing interests), mixed strategies are optimal.

---

### Finding Nash Equilibrium in Mixed Strategies

**The indifference condition:** In a mixed strategy NE, each player must be **indifferent** between their pure strategies (otherwise they'd just play one of them with probability 1).

**Method:** Set the opponent indifferent between their strategies by choosing your own probabilities.

### Full Example: Coin Toss

Player 1 plays Head with probability p, Tail with (1-p).
Player 2 plays Head with probability q, Tail with (1-q).

**Finding p* (Player 1's equilibrium probability):**
Make Player 2 indifferent between Head and Tail:

EU₂(Head) = EU₂(Tail)

EU₂(Head) = p·(-1) + (1-p)·(1) = -p + 1 - p = 1 - 2p

EU₂(Tail) = p·(1) + (1-p)·(-1) = p - 1 + p = 2p - 1

Set equal: 1 - 2p = 2p - 1 → 2 = 4p → **p* = 1/2**

**Finding q* (Player 2's equilibrium probability):**
Make Player 1 indifferent between Head and Tail:

EU₁(Head) = q·(1) + (1-q)·(-1) = 2q - 1

EU₁(Tail) = q·(-1) + (1-q)·(1) = 1 - 2q

Set equal: 2q - 1 = 1 - 2q → 4q = 2 → **q* = 1/2**

**Nash Equilibrium:** Both players play Head and Tail each with probability **1/2**.

---

### Example: King/Queen Game

|  | P2: King (q) | P2: Queen (1-q) |
|---|---|---|
| **P1: King (p)** | 4, 2 | 3, 6 |
| **P1: Queen (1-p)** | 2, 4 | 6, 1 |

**Solve for p*** (make P2 indifferent):

EU₂(King) = p·2 + (1-p)·4 = 4 - 2p

EU₂(Queen) = p·6 + (1-p)·1 = 1 + 5p

4 - 2p = 1 + 5p → 3 = 7p → **p* = 3/7**

**Solve for q*** (make P1 indifferent):

EU₁(King) = q·4 + (1-q)·3 = 3 + q

EU₁(Queen) = q·2 + (1-q)·6 = 6 - 4q

3 + q = 6 - 4q → 5q = 3 → **q* = 3/5**

---

## 7. DYNAMIC / REPEATED GAMES

### Repeated Games: The Big Picture
The same static game is played **multiple times**. This changes incentives — future punishment can sustain cooperation.

### Finite Repetition (N rounds)

**Backward induction on finite game:**
- In the **last period (N):** no future punishment possible → dominant strategy is to compete (play NE of one-shot game)
- In **period N-1:** both know period N will be competitive → no incentive to cooperate in N-1 either
- Unravel backwards: **compete from the very first period!**

**Result: In a finitely repeated game, the only equilibrium is to play the one-shot NE in every period.**

This is why cartel agreements tend to break down near the end of a market/contract period.

---

### Infinite Repetition (Supergame)

**Supergame:** The game is repeated infinitely. Now future punishment matters!

- **Rational strategy:** maintain the collusive (high) price, because future losses from the price war outweigh any one-time gain from deviation
- As soon as one firm cuts price → the other follows in the next period → both end up in competition forever
- **The threat of future punishment sustains cooperation**

---

### Tit-for-Tat Strategy

**Definition:** "I do to you what you do to me."
- Start by cooperating in Period 1
- In each subsequent period, play whatever your opponent played last period
- If opponent cooperates → you cooperate; if they defect → you defect next period; if they then cooperate again → you forgive and cooperate

**Why Tit-for-Tat is optimal in infinite games:**
1. **Punishment:** If the other cheats, you punish → they can't steal your market
2. **Forgiveness:** If honest mistakes occur, you don't start a permanent price war

**Tit-for-Tat can solve the Prisoner's Dilemma** in infinitely repeated games — it turns individual self-interest into collective cooperation.

---

## 8. SEQUENTIAL GAMES & BACKWARD INDUCTION

### Sequential Games: Key Features
- Players take **turns** (one moves first, the other observes and responds)
- Each player thinks through possible decisions AND reactions of opponents
- Representation: **Extensive form (game tree)**
- Solution method: **Backward induction**
- Examples: Stackelberg competition, entry-deterrence, advertising then response

### Extensive Form (Game Tree)
- Each **node** = a decision point (situation in the game)
- **Arrows** = actions/moves available
- Each action leads to a new node
- **Final nodes** = end of game, showing payoffs
- Player 1 moves first (top node), Player 2 responds at the next level

### Backward Induction: How It Works
1. Start at the **last decision nodes** — what will the last player choose? (They pick the branch with the highest payoff for them)
2. Work **backwards** — given what the last player will choose, what does the second-to-last player choose?
3. Continue until you reach the **first player's decision** at the root

**Key insight:** The first mover must anticipate the future responses of all subsequent players.

---

### Example: Sequential Product Choice

Firm 1 decides first (Crispy or Sweet), then Firm 2 responds.

```
            Firm 2 → Crispy:   -5, -5
F1 → Crispy ┤
            Firm 2 → Sweet:   15, 15  ← Firm 2 chooses this (15>-5)

            Firm 2 → Crispy:  17, 13  ← Firm 2 chooses this (13>-5)
F1 → Sweet  ┤
            Firm 2 → Sweet:   -5, -5
```

**Backward induction:**
- If F1 plays Crispy: F2 picks Sweet (15 > -5) → F1 gets 15
- If F1 plays Sweet: F2 picks Crispy (13 > -5) → F1 gets 17
- F1 compares: 17 > 15 → **F1 chooses Sweet; F2 responds with Crispy**
- **Equilibrium: (Sweet, Crispy) → payoffs (17, 13)**

The first mover gets the better product (Sweet) and the higher payoff. **First-mover advantage** in sequential games!

---

## 9. CREDIBLE THREATS

### Strategic Goals of Firms
Firms may want to steer the game to a **favorable Nash equilibrium** by:
- Making entry unattractive for potential entrants
- Convincing competitors to reduce output, leave the market, or set higher prices
- Using implicit agreements that benefit the firm

### Empty Threats
**Empty threat:** A threat the opponent knows you won't follow through with, because carrying it out would hurt you.

Example: Far Out Engines (FOE) vs Race Car Motors (RCM):

|  | RCM: Small cars | RCM: Big cars |
|---|---|---|
| **FOE: Small engines** | 3, **6** | 3, 0 |
| **FOE: Big engines** | 1, 1 | **8**, **3** |

- NE: (Small engines, Small cars) — RCM has first mover advantage
- FOE threatens: "If you make big cars, I'll still make big engines" → but this would give FOE only 1 (vs 3 from small engines) — not credible!

**Lesson: Empty threats don't change the outcome because rational players ignore them.**

### Making Threats Credible — Commitment

To make a threat credible, you must **change the payoff structure** so that you'd actually want to follow through.

**Example:** FOE **dismantles** its small engine capacity:

|  | RCM: Small cars | RCM: Big cars |
|---|---|---|
| **FOE: Small engines** | 0, **6** | 0, 0 |
| **FOE: Big engines** | **1**, 1 | **8**, **3** |

Now FOE's dominant strategy is Big engines (1>0 and 8>0) → threat is credible! → RCM must respond with Big cars → NE shifts to (Big engines, Big cars).

**By destroying capacity, FOE gains credibility and forces the more favorable outcome.**

---

### Airbus vs. Boeing Example

**Without subsidy** (Boeing has a lead → first-mover advantage):

|  | Airbus: Produce | Airbus: Don't produce |
|---|---|---|
| **Boeing: Produce** | -10, -10 | 100, 0 |
| **Boeing: Don't produce** | 0, 100 | 0, 0 |

- If Boeing produces first, Airbus won't produce (-10 < 0) → **Boeing produces, gets 100**

**With European government subsidy of €20M to Airbus:**

|  | Airbus: Produce | Airbus: Don't produce |
|---|---|---|
| **Boeing: Produce** | -10, **10** | 100, 0 |
| **Boeing: Don't produce** | 0, **120** | 0, 0 |

- Now Airbus's dominant strategy is **Produce** (10>0, 120>0) — subsidy makes producing always better
- Boeing knows Airbus will produce → Boeing's best reply is **Don't produce** (0 > -10)
- **Result: Airbus produces, Boeing exits**

**Key insight:** Government policy (subsidies) can change the payoff structure and shift Nash equilibria — this is the industrial policy argument for subsidizing strategic industries.

---

## MASTER CHEAT SHEET

### Solution Concepts Hierarchy

```
Static Game → Look for dominant strategies first
  ↓ (if found) → NE = everyone plays dominant strategy
  ↓ (if not found) → Find NE using best response analysis
  ↓ (if no NE in pure strategies) → Find NE in mixed strategies

Sequential Game → Use backward induction (extensive form / game tree)

Repeated Game:
  Finite N rounds → Unravel backwards → Play one-shot NE every round
  Infinite rounds → Cooperation possible via Tit-for-Tat
```

### Key Formulas & Conditions

| Concept | Formula / Condition |
|---|---|
| Nash Equilibrium | Uᵢ(sᵢ*, s₋ᵢ*) ≥ Uᵢ(sᵢ, s₋ᵢ*) for all i |
| Dominant strategy | sᵢ* beats all other strategies regardless of s₋ᵢ |
| Mixed strategy NE | Make opponent indifferent: EU(strategy A) = EU(strategy B) |
| Maximin | max over sᵢ of [min over s₋ᵢ of Uᵢ(sᵢ, s₋ᵢ)] |
| Expected payoff | E[U] = Σ prob(opponent plays j) × U(i plays s, j plays j) |

### Quick Summary Table

| Game type | Representation | Solution method | Example |
|---|---|---|---|
| Static, dominant strategy | Payoff matrix | Find dominant strategy → NE | Advertising game, Prisoner's dilemma |
| Static, no dominant strategy | Payoff matrix | Best response → NE | Battle of the sexes, Product choice |
| Static, no pure NE | Payoff matrix | Mixed strategies (indifference condition) | Coin toss, King/Queen |
| Maximin (uncertainty/irrationality) | Payoff matrix | Maximize minimum payoff | Encryption investment |
| Sequential | Game tree | Backward induction | Stackelberg, Cereal product choice |
| Repeated (finite) | Payoff matrix × N periods | Backward unraveling | Pricing in finite market |
| Repeated (infinite) | Supergame | Tit-for-Tat | Cartel stability |
| Credible threats | Game tree + commitment | Change payoffs to make threat credible | Airbus/Boeing, FOE/RCM |

### The Prisoner's Dilemma Pattern (exam favorite!)
Appears in: firms competing vs colluding, advertising decisions, arms races, OPEC, cartel stability.

**Recognition:** The game where individual rationality (dominant strategy) leads to a worse collective outcome than cooperation.

**Solutions to the dilemma:**
1. **Binding contracts** (cooperative games) — illegal in most markets
2. **Best-price guarantees** (price leadership) — eliminates the incentive to defect
3. **Repeated interaction** + Tit-for-Tat — sustains cooperation over time

---

*WU Vienna — Microeconomics Module 6 | All content based on lecture slides*
