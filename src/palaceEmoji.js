/* The same Unicode picker works across Palace Chat, Commons and Forum.
 * Plain text only: never parses HTML or writes markup into user content. */
export const PALACE_EMOJI_GROUPS=[
 {name:'Faces',symbols:'😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 🙃 😉 😌 😍 🥰 😘 😋 😎 🤩 🥳 🥹 😭 🥺 😢 😡 😱 🤔 🤗 🫶 😴 🫠 😇'.split(' ')},
 {name:'Hearts',symbols:'❤️ 🧡 💛 💚 💙 💜 🩵 🩷 🤍 🖤 🤎 💖 💗 💕 💞 💘 💝 💟 💔 ❤️‍🔥 ❤️‍🩹 🏳️‍🌈 🏳️‍⚧️'.split(' ')},
 {name:'People',symbols:'👋 🙌 👏 🤝 🤞 ✌️ 🤟 👍 👎 💪 🙏 🫂 👑 💃 🕺 🧑‍🎨 🧑‍💻 🧑‍🎤 🧑‍🏫'.split(' ')},
 {name:'Nature',symbols:'🌙 🌛 🌜 🌕 🌑 ⭐ 🌟 ✨ 💫 ☄️ 🌠 🌈 🌸 🌹 🥀 🌷 🌻 🌺 🍁 🍄 🦋 🐈 🦉 🐉 🔥 🌊'.split(' ')},
 {name:'Stories',symbols:'📖 📚 📝 ✍️ 🖋️ 🖊️ 📜 🪶 🎨 🎭 🎬 🎶 🎵 🧵 🕯️ 🔮 🪄 🗝️ 🏰 🪞 ⚔️ 🏹 💌 🪐 🎁 🎉 🎊 ☕ 🍵'.split(' ')}
];
export function insertPalaceEmoji(text,emoji,start,end,maxLength){
 const base=String(text||'');
 const a=Number.isInteger(start)?Math.min(Math.max(0,start),base.length):base.length;
 const b=Number.isInteger(end)?Math.min(Math.max(a,end),base.length):a;
 const glyph=String(emoji||'');
 if(base.length-(b-a)+glyph.length>maxLength)return {text:base,cursor:a,inserted:false};
 return {text:base.slice(0,a)+glyph+base.slice(b),cursor:a+glyph.length,inserted:true};
}
