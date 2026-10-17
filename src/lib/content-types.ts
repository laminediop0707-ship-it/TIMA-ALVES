/** Shape of the editable site content (draft + published). */

export type Poem = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  continueLabel: string;
};

export type Slide = {
  id: string;
  mediaId: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  title: string;
  caption: string;
  alt: string;
  isCover: boolean;
};

export type Content = {
  meta: {
    documentTitle: string;
    brandName: string;
    shortName: string;
    badge: string;
    footerSignature: string;
  };
  landing: {
    badge: string;
    heading: string;
    subheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
    note: string;
  };
  gate: {
    badge: string;
    heading: string;
    message: string;
    label: string;
    placeholder: string;
    button: string;
    errorMessage: string;
    hint: string;
  };
  intro: {
    badge: string;
    heading: string;
    message: string;
    startButton: string;
  };
  poems: Poem[];
  slideshow: {
    kicker: string;
    heading: string;
    intro: string;
    emptyMessage: string;
    prevLabel: string;
    nextLabel: string;
    continueLabel: string;
    autoplayOn: string;
    autoplayOff: string;
    counterTemplate: string;
    loadingLabel: string;
    errorLabel: string;
  };
  final: {
    kicker: string;
    heading: string;
    message: string;
    signature: string;
    heartButton: string;
    replayLabel: string;
    finaleMessage: string;
  };
  decorations: {
    emojis: string[];
  };
};
