/****************************************************
 * 1) GLOBAL SETUP & DOM REFERENCES
 ****************************************************/
const cardValues = ["A", "K", "Q", "J"];

// Distinct z-index for each rank
const rankZOrder = {
  "A": 4,
  "K": 1,
  "Q": 3,
  "J": 2
};

// The 4 slot positions in the row
const cardPositions = [0, 120, 240, 360];
const cardY = 15;

// The center position (gather spot)
const centerX = (cardPositions[0] + cardPositions[cardPositions.length - 1]) / 2;
const centerY = 15;

// We'll store references to our main elements
//const container = document.getElementById("cardContainer");
const dealBtn = document.getElementById("dealBtn");
const goBtn = document.getElementById("goBtn");
const restartBtn = document.getElementById("restartBtn");

// Initialize their states
function setupButtonsInitial() {
  dealBtn.disabled = false;
  dealBtn.style.display = "inline-block";

  goBtn.disabled = true;
  goBtn.style.display = "none";

  restartBtn.disabled = false; 
  restartBtn.style.display = "inline-block";
}

// We'll store the card elements in an array
let cardElements = [];

// A flag to track if we've done the "Go" shuffle yet
let hasFlipped = false;


/****************************************************
 * 2) UTILITY FUNCTIONS
 ****************************************************/
/** Fisher-Yates shuffle in-place */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** Disable all clicks on the cards (pointer-events: none). */
function disableCardClicks() {
  cardElements.forEach((card) => {
    card.classList.add("disabled-clicks");
  });
}

/** Re-enable clicks on the cards. */
function enableCardClicks() {
  cardElements.forEach((card) => {
    card.classList.remove("disabled-clicks");
  });
}

/****************************************************
 * 3) INITIAL GAME CREATION
 ****************************************************/
/**
 * Called once at the start (and also called by "restartGame()" to rebuild).
 * Creates the cards, puts them in the top-left corner (deck-position),
 * face-down at half-size. They do NOT appear in the row yet—this is done by "dealCards()" 
 * after the user clicks the "Deal" button.
 */
function initGame() {
  // Clear any existing cards
  removeAllCardsFromBody();
  cardElements = [];
  hasFlipped = false;

  // Shuffle the deck
  const deck = [...cardValues];
  shuffle(deck);

  // Build the DOM for each card
  deck.forEach((value, i) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "deck-position", "flipped"); 
    // "deck-position" means top-left corner, 50% scale, face-down
    cardDiv.style.zIndex = rankZOrder[value];

    // We'll store the intended slotIndex for later
    cardDiv.dataset.slotIndex = i;

    // Build the flipping wrapper
    const cardTransition = document.createElement("div");
    cardTransition.classList.add("card-transition");

    // Front face
    const frontFace = document.createElement("div");
    frontFace.classList.add("card-face", "front");
    frontFace.textContent = value;

    // Back face
    const backFace = document.createElement("div");
    backFace.classList.add("card-face", "back");

    cardTransition.appendChild(frontFace);
    cardTransition.appendChild(backFace);
    cardDiv.appendChild(cardTransition);
    document.body.appendChild(cardDiv);

    // Store in array
    cardElements.push(cardDiv);

    // On click, if card is face-down, flip it face-up
    cardDiv.addEventListener("click", () => {
      if (
        cardDiv.classList.contains("flipped") &&
        !cardDiv.classList.contains("disabled-clicks")
      ) {
        cardDiv.classList.remove("flipped");
      }
    });

    // Also store the rank
    cardDiv.dataset.value = value;
  });

  // Reset button states/messages
  goBtn.textContent = "Go";
}

/****************************************************
 * 4) "DEAL" ANIMATION
 ****************************************************/
/**
 * Moves each card from the top-left "deck" position to its final
 * row position, while also flipping from face-down to face-up and
 * scaling from 0.5 to 1. 
 */
function dealCards() {
  // 1) Enable transitions from .deck-position to the row
  //    This is already set in CSS: transition: transform 1s ease;

  // 2) After a tiny timeout, remove the "deck-position" class and remove ".flipped"
  //    so the card grows to 100%, rotates to face-up, and moves to the row.
  setTimeout(() => {
    cardElements.forEach((card, i) => {
      // Remove the "deck-position" class so it can animate to the final row
      card.classList.remove("deck-position");
      // Also unflip so it rotates to show the front
      card.classList.remove("flipped");

      // We also set the transform to its final row location:
      const slotIndex = parseInt(card.dataset.slotIndex, 10);
      card.style.transform = `translate(${cardPositions[slotIndex]}px, ${cardY}px) scale(1) rotateY(0deg)`;
    });
  }, 50);
}

/****************************************************
 * 5) "GO" BUTTON LOGIC: FLIP DOWN, GATHER, REDISTRIBUTE
 ****************************************************/
function flipAllCards() {
  cardElements.forEach((card) => {
    card.classList.add("flipped");
  });
}

function gatherAllCardsToCenter() {
  cardElements.forEach((card) => {
    card.style.transform = `translate(${centerX}px, ${centerY}px) scale(1)`;
  });
}

/**
 * Randomly reassign slots and animate them out from center to new positions.
 */
function redistributeAllCardsRandomly() {
  const newSlots = [0, 1, 2, 3];
  shuffle(newSlots);

  cardElements.forEach((card, i) => {
    const newSlotIndex = newSlots[i];
    card.dataset.slotIndex = newSlotIndex;
    card.style.transform = `translate(${cardPositions[newSlotIndex]}px, ${cardY}px) scale(1)`;
  });
}

/****************************************************
 * 6) "RESTART" LOGIC
 ****************************************************/
/**
 * Reset the entire game so we can play again from scratch.
 * We remove all cards, re-init them in the top-left corner, face-down, half-scale.
 */
function removeAllCardsFromBody() {
  // first, locate all cards in the DOM
  // second, remove them from the DOM
  // document.body.removeChild(cardDiv);
  let cardDomElements = document.body.getElementsByClassName("card");
  while (cardDomElements.length > 0) {
    document.body.removeChild(cardDomElements[cardDomElements.length-1]);
  }
}

function restartGame() {
  initGame();
}

/****************************************************
 * 7) ATTACH BUTTON HANDLERS
 ****************************************************/
dealBtn.addEventListener("click", () => {
  // Start dealing
  dealBtn.disabled = true;
  dealBtn.style.display = "none";
  // The user wants to see the initial "fly in" animation from top-left.
  dealCards();
  
  // After dealing finishes (say 1s?), show the Go button
  // We'll do a setTimeout matching the deal animation time
  setTimeout(() => {
    goBtn.disabled = false;
    goBtn.style.display = "inline-block";
  }, 1000);
});

goBtn.addEventListener("click", () => {
  // Hide the Go button immediately
  goBtn.disabled = true;
  goBtn.style.display = "none";

  if (!hasFlipped) {
    hasFlipped = true;

    // 1) Disable clicks
    disableCardClicks();

    // 2) Flip all face-down
    flipAllCards();

    // Wait ~1.1s (0.6s for flip + 0.5s pause) before gathering
    setTimeout(() => {
      gatherAllCardsToCenter();

      // Wait 1s for gather + 0.5s pause = 1.5s
      setTimeout(() => {
        redistributeAllCardsRandomly();

        // Wait 1s for redistribute, then re-enable clicks
        setTimeout(() => {
          enableCardClicks();
        }, 1000);

      }, 1500);

    }, 1100);

    goBtn.textContent = "Cards are shuffled! Click on any card to reveal.";
  } else {
    alert("Click on a card to reveal it, or press Restart to play again.");
  }
});

restartBtn.addEventListener("click", () => {
  restartGame();

  // Reset button states
  setupButtonsInitial();
});

/****************************************************
 * 8) INITIALIZE ON PAGE LOAD
 ****************************************************/
initGame();

setupButtonsInitial();
/* 
   By default, we wait for the user to press "Deal" to see the 
   flying-in animation from top-left. 
*/

