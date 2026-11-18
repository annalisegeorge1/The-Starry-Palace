import React, {useId, useState} from 'react';

function SpoilerPassage({text}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <><button type="button" className="passage-toggle" aria-expanded={open}
    aria-controls={id} onClick={() => setOpen(value => !value)}>
    {open ? 'Hide spoiler' : 'Reveal spoiler'}
  </button><span id={id} hidden={!open}>{open ? text : null}</span></>;
}

export default function CommentText({body}) {
  // An unmatched delimiter remains ordinary text. Never interpret comment HTML.
  return <p>{body.split(/(\|\|[\s\S]+?\|\|)/g).map((part, index) =>
    index % 2 ? <SpoilerPassage key={index + part} text={part.slice(2, -2)}/> : part
  )}</p>;
}
