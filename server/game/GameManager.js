
import { wordLists, getRandomWordPair } from '../data/words.js';

export class GameManager {
    constructor(io, roomCode, roomData) {
        this.io = io;
        this.roomCode = roomCode;
        this.roomData = roomData;
        this.timer = null;
    }

    /* ---------------- GAME LOOP ---------------- */

    // Start or Reset the Game
    startGame() {
        this.roomData.status = 'playing';
        this.roomData.currentRound = 1;
        this.roomData.scores = {}; // userId -> score
        this.roomData.players.forEach(p => this.roomData.scores[p.userId] = 0);

        this.startRound();
    }

    startRound() {
        // 1. Reset Round State
        this.roomData.phase = 'round_start';
        this.roomData.responses = {}; // userId -> text
        this.roomData.votes = {}; // userId -> targetId
        this.roomData.imposterId = null;
        this.roomData.wordPair = null;

        // 2. Assign Roles
        const players = this.roomData.players;
        const imposterIndex = Math.floor(Math.random() * players.length);
        this.roomData.imposterId = players[imposterIndex].userId;

        // 3. Assign Words
        const difficulty = this.roomData.settings.difficulty;
        this.roomData.wordPair = getRandomWordPair(difficulty);

        console.log(`[GAME] Room ${this.roomCode} | Round ${this.roomData.currentRound} | Imposter: ${players[imposterIndex].username} | Word: ${this.roomData.wordPair.main}`);

        // 4. Notify Clients (Private Data)
        this.broadcastGameState();

        // 5. Start Response Phase after short delay (to show "Round X")
        setTimeout(() => {
            this.startResponsePhase();
        }, 3000);
    }

    startResponsePhase() {
        this.roomData.phase = 'response';
        const duration = this.roomData.settings.responseTime || 40;
        this.roomData.phaseEndTime = Date.now() + (duration * 1000);

        this.broadcastGameState();
        this.startTimer(duration, () => this.startVotingPhase());
    }

    handleResponse(userId, text) {
        if (this.roomData.phase !== 'response') return;

        this.roomData.responses[userId] = text;
        this.broadcastGameState();

        // Check if all submitted
        const allSubmitted = this.roomData.players.every(p => this.roomData.responses[p.userId]);
        if (allSubmitted) {
            this.clearTimer();
            setTimeout(() => this.startVotingPhase(), 1000); // Short buffer
        }
    }

    startVotingPhase() {
        this.roomData.phase = 'voting';
        const duration = this.roomData.settings.votingTime || 20;
        this.roomData.phaseEndTime = Date.now() + (duration * 1000);

        this.broadcastGameState();
        this.startTimer(duration, () => this.endRound());
    }

    handleVote(voterId, targetId) {
        if (this.roomData.phase !== 'voting') return;
        // Prevent double voting (though UI should handle it)
        if (this.roomData.votes[voterId]) return;

        this.roomData.votes[voterId] = targetId;
        this.broadcastGameState();

        // Check if all voted
        const allVoted = this.roomData.players.every(p => this.roomData.votes[p.userId]);
        if (allVoted) {
            this.clearTimer();
            setTimeout(() => this.endRound(), 1000);
        }
    }

    endRound() {
        this.clearTimer();
        this.roomData.phase = 'result';

        // --- SCORING LOGIC ---
        const { imposterId, votes, wordPair, responses, players, scores } = this.roomData;
        const resultData = {
            imposterId,
            wordPair, // Reveal words
            votes,
            responses,
            roundScores: {}, // userId -> score gained this round
            survived: false,
            imposterCaught: false
        };

        let imposterVotes = 0;
        const totalVotes = players.length;

        Object.values(votes).forEach(targetId => {
            if (targetId === imposterId) imposterVotes++;
        });

        // Did Imposter Survive? (Survives if less than 50% votes, or strictly majority needed?)
        // Let's say: Caught if Majority votes for them. If split, they survive?
        // Simple Rule: Caught if they receive the MOST votes (plurality) OR > 50%? 
        // Standard Social Deduction: Must have majority or plurality. 
        // Let's use: Caught if received more than 50% of potential votes? Or just most votes?
        // Let's go with: Caught if (imposterVotes > totalVotes / 2). "Majority Rule".
        // Actually, typically it's just "Most Voted". But with 3 players...
        // Let's stick to Majority for strictness, or Plurality. 
        // Let's use Plurality (whoever got most votes is out).

        // Count votes per player
        const voteCounts = {};
        players.forEach(p => voteCounts[p.userId] = 0);
        Object.values(votes).forEach(targetId => {
            if (voteCounts[targetId] !== undefined) voteCounts[targetId]++;
        });

        // Determine who was kicked (max votes)
        let maxVotes = 0;
        let kickedIds = [];
        Object.entries(voteCounts).forEach(([uid, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                kickedIds = [uid];
            } else if (count === maxVotes) {
                kickedIds.push(uid);
            }
        });

        // Imposter Caught if they are in the kicked list? Or strictly mostly votes?
        // If tie, usually no one kicked or random.
        // Let's say: Imposter caught if they are the SOLE person with max votes.
        const imposterKicked = kickedIds.length === 1 && kickedIds[0] === imposterId;
        resultData.imposterCaught = imposterKicked;
        resultData.kickedIds = kickedIds;

        // --- POINTS DISTRIBUTION ---
        players.forEach(p => {
            const uid = p.userId;
            let gain = 0;

            if (uid === imposterId) {
                // IMPOSTER SCORING
                if (!imposterKicked) {
                    gain += 150; // Imposter Survives
                }

                // Penalty Check: Did they say the exact agent word?
                const imposterResponse = responses[uid];
                if (imposterResponse && imposterResponse.toLowerCase().includes(wordPair.main.toLowerCase())) {
                    gain = Math.floor(gain * 0.5); // 50% Penalty
                    resultData.penaltyApplied = true;
                }
            } else {
                // AGENT SCORING
                if (votes[uid] === imposterId) {
                    gain += 100; // Correct Vote
                }
                if (imposterKicked) {
                    gain += 50; // Agent Win Bonus
                }
            }

            // Update Total
            this.roomData.scores[uid] = (this.roomData.scores[uid] || 0) + gain;
            resultData.roundScores[uid] = gain;
        });

        this.roomData.lastRoundResult = resultData;

        // Broadcast Result
        this.broadcastGameState();

        // Check Game Over or Next Round
        const totalRounds = this.roomData.settings.rounds || 5;
        if (this.roomData.currentRound >= totalRounds) {
            setTimeout(() => this.endGame(), 8000); // 8s to see results
        } else {
            this.roomData.currentRound++;
            setTimeout(() => this.startRound(), 8000);
        }
    }

    endGame() {
        this.roomData.status = 'ended';
        this.roomData.phase = 'game_over';
        this.broadcastGameState();
    }

    /* ---------------- HELPERS ---------------- */

    startTimer(seconds, callback) {
        this.clearTimer();
        this.roomData.timer = seconds;

        // Optional: Emit timer tick every second if syncing is loose
        // Or just let client countdown based on phaseEndTime
        // Ideally client calculates time remaining.

        this.timer = setTimeout(() => {
            callback();
        }, seconds * 1000);
    }

    clearTimer() {
        if (this.timer) clearTimeout(this.timer);
    }

    broadcastGameState() {
        // We filter private data for each player
        this.roomData.players.forEach(player => {
            const privateState = this.getPrivateState(player.userId);
            if (player.socketId) {
                this.io.to(player.socketId).emit("game_state_update", privateState);
            }
        });
    }

    getPrivateState(userId) {
        // Clone to avoid mutation
        const state = {
            status: this.roomData.status,
            phase: this.roomData.phase,
            phaseEndTime: this.roomData.phaseEndTime,
            currentRound: this.roomData.currentRound,
            totalRounds: this.roomData.settings.rounds,
            players: this.roomData.players.map(p => ({
                ...p,
                hasSubmitted: !!this.roomData.responses[p.userId],
                hasVoted: !!this.roomData.votes[p.userId]
            })),
            lastRoundResult: this.roomData.lastRoundResult,
            scores: this.roomData.scores
        };

        // Info Hiding based on Phase/Role
        if (state.status === 'playing') {
            const isImposter = this.roomData.imposterId === userId;
            state.myRole = isImposter ? 'imposter' : 'agent';

            // Should I show the word?
            if (this.roomData.wordPair) {
                state.myWord = isImposter ? this.roomData.wordPair.imposter : this.roomData.wordPair.main;
                state.forbiddenWord = isImposter ? this.roomData.wordPair.main : null; // For Imposter warning
            }

            // Responses: Hide during writing?
            // "Discussion phase" usually shows responses.
            // If phase is 'response', hide others' responses.
            if (state.phase === 'response') {
                state.responses = {}; // Hide all
            } else {
                state.responses = this.roomData.responses; // Show all
            }
        }

        return state;
    }
}
