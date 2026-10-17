import type { Content } from "@/lib/content-types";

/**
 * Default content used to seed the very first draft.
 * Everything here is editable from /admin — this is only the starting point.
 */
export const DEFAULT_CONTENT: Content = {
  meta: {
    documentTitle: "Estère Adousinda Alves — Pas juste un prénom 💗",
    brandName: "Estère Adousinda Alves",
    shortName: "Estère",
    badge: "✦ Une petite lettre digitale",
    footerSignature: "made by lemzo_biker ❤️",
  },

  landing: {
    badge: "🎁 Invitation privée — pour une seule personne",
    heading: "Estère Adousinda Alves",
    subheading:
      "Pas juste un prénom.\nUne présence qu'on a envie de découvrir, strophe après strophe.",
    ctaPrimary: "Unlock my surprise 💖",
    ctaSecondary: "Who made this?",
    note: "Ce site est une surprise privée. Si tu n'es pas la birthday girl… tu es au mauvais endroit. 👀",
  },

  gate: {
    badge: "🔒 Accès privé",
    heading: "Hey you, birthday girl ! 💗✨",
    message:
      "Une petite surprise t'attend ici… Mais avant de découvrir ton cadeau, il va falloir prouver que c'est bien toi. 👀💌",
    label: "Ton nom complet",
    placeholder: "Écris ton nom complet ici…",
    button: "Unlock my surprise 💖",
    errorMessage: "Oops girl 😭😂 Wrong name ! Try again, birthday queen.",
    hint: "Indice : trois mots, comme sur ta carte d'identité. 😌",
  },

  intro: {
    badge: "Yo birthday girl",
    heading: "Today is YOUR day 👑",
    message:
      "Yo birthday girl ! 😮‍💨💗\n\nToday is YOUR day, ma queen. No stress, no bad vibes, just love, blessings et gros cash ! 💸✨\n\nAujourd'hui, le monde tourne autour de toi… mais relax hein, demain on reprend nos vies normales. 😂👑\n\nJ'ai préparé un petit quelque chose pour toi. Take your time, enjoy the moment, et surtout… don't skip anything. 👀❤️",
    startButton: "Okay girl, let's start 💌",
  },

  poems: [
    {
      id: "poem-1",
      kicker: "01 — Le prénom",
      title: "Une mélodie",
      text: "Estère,\n\nton prénom sonne comme une mélodie\nqu'on n'oublie pas,\n\net ton visage…\ncomme une œuvre qu'on ne regarde jamais\ndeux fois de la même façon.",
      continueLabel: "Wait… this part is for real 🥹",
    },
    {
      id: "poem-2",
      kicker: "02 — Le regard",
      title: "Quelque chose de calme",
      text: "Dans tes yeux,\nil y a quelque chose de calme,\n\nmais assez puissant\npour faire taire le monde autour.\n\nEt ça, ma belle, ça ne s'achète pas. 😮‍💨",
      continueLabel: "You thought I was done? Nahhh 😂",
    },
    {
      id: "poem-3",
      kicker: "03 — Real talk",
      title: "Les vrais vœux",
      text: "Estère, today c'est ton day, let the whole world know, ✨\nUne nouvelle année, de nouveaux wins, watch yourself glow.\n\nJe te souhaite une longue vie, une santé en béton,\nDes bénédictions dans tes projets et la paix dans ton cœur, no question.\n\nQue tes rêves deviennent real, que tes efforts payent,\nQue la chance soit dans ton camp chaque time you step out, every day. 💫\n\nFull cash dans les poches, que les billets fassent la queue, 💸\nQue ton compte prenne du poids et que tu réalises tes vœux.\n\nEt surtout, reste vraie, garde ton sourire et ton flow,\nMême si tu deviens famous, n'oublie pas les gens d'en bas, yo ! 😂\n\nReal talk, tu comptes beaucoup, plus que ce que je montre parfois,\nEt je voulais que tu le saches, sans faire trop de cinéma.\n\nSo enjoy your birthday, ma queen, shine like you own the sky,\nLong life, big blessings, pure happiness — that's my wish for you tonight. 💗",
      continueLabel: "Now let me get serious for a second ❤️",
    },
    {
      id: "poem-4",
      kicker: "04 — Petite pause",
      title: "Oui, tu fais la star",
      text: "Bon, on va pas se mentir…\n\ntu fais un peu la star des fois. 😂👑\nLe miroir, il en a marre de toi.\n\nMais franchement ? Continue.\nParce que le monde a besoin\nde gens qui assument leur lumière.\n\nJuste… ne prends pas trop la grosse tête hein. 😌💗",
      continueLabel: "You thought it was over? Nahhh 😂",
    },
    {
      id: "poem-5",
      kicker: "05 — Ce petit quelque chose",
      title: "Plus profond",
      text: "Estère,\n\nt'es le genre de fille\nqu'on ne remarque pas seulement\navec les yeux,\n\nmais avec quelque chose\nde plus profond.\n\nUne présence, une énergie,\nun petit quelque chose\nqu'on ne peut ni expliquer ni copier.",
      continueLabel: "One last thing, ma queen… 👀",
    },
    {
      id: "poem-6",
      kicker: "06 — Alves",
      title: "La dernière strophe",
      text: "Et Alves, franchement…\n\nsi ton nom était un poème,\nje crois que j'aurais envie\nd'en écrire les vers\n\njusqu'à oublier où commence la poésie\net où commence la réalité.\n\n❤️‍🔥",
      continueLabel: "Show me the memories 📸✨",
    },
  ],

  slideshow: {
    kicker: "Mes souvenirs",
    heading: "Les moments que je garde",
    intro:
      "Prends ton temps, regarde chaque détail. Chaque image a sa petite histoire.",
    emptyMessage:
      "Aucun souvenir n'a encore été publié. Reviens un peu plus tard, birthday girl. 💗",
    prevLabel: "← Back to the memories",
    nextLabel: "Next surprise ✨ →",
    continueLabel: "Keep going, birthday girl 💗",
    autoplayOn: "Pause le diaporama ⏸",
    autoplayOff: "Lance le diaporama ▶",
    counterTemplate: "Souvenir {current} / {total}",
    loadingLabel: "Chargement du souvenir…",
    errorLabel: "Oups, ce souvenir ne veut pas s'afficher. 😅",
  },

  final: {
    kicker: "One last thing… 👀",
    heading: "You made it to the end, birthday girl. 🥹💗",
    message:
      "J'espère que cette petite surprise t'a fait sourire. Tu mérites une vie remplie de paix, de love, de réussite et de blessings.\n\nLong life, full cash, big wins et zéro bad vibes. May God bless your journey and protect your smile. ❤️\n\nEt maintenant, ne prends pas trop la grosse tête hein… ce site ne fait pas de toi une milliardaire internationale. Pas encore. 😂💸\n\nHappy birthday, Estère Adousinda Alves. You mean a lot to me, for real. 💖",
    signature: "Estère Adousinda Alves",
    heartButton: "Release the love 💗",
    replayLabel: "Run it again 🔁",
    finaleMessage:
      "Long life, full cash, big wins et zéro bad vibes. May God bless your journey and protect your smile. ❤️",
  },

  decorations: {
    emojis: ["💗", "💖", "♥", "✦", "🌸", "💫", "👑"],
  },
};

export function cloneDefaultContent(): Content {
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT)) as Content;
}
