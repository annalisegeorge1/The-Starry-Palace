export const ORRERY_GENRES=[
'Gothic romance','Cyberpunk comedy','Cozy mystery','Mythic horror','Court intrigue','Solarpunk adventure','Literary ghost story','Space opera melodrama','Magical realism','Historical fantasy','Domestic thriller','Absurdist fairytale',
'Afrofuturist epic','Caribbean gothic','Diaspora family drama','Queer coming-of-age','Sapphic sword-and-sorcery','Achillean court romance','Trans magical realism','Nonbinary space opera','Hopepunk rebellion','Dark academia mystery','Light academia romance','Urban fantasy noir',
'Folkloric horror','Pastoral fantasy','Oceanic fantasy','Desert fantasy','Arctic survival fantasy','Gaslamp mystery','Steampunk caper','Biopunk tragedy','Post-apocalyptic romance','Utopian satire','Dystopian heist','Alternate-history drama',
'Time-slip romance','Portal fantasy','Dream logic mystery','Cosmic horror comedy','Monster workplace comedy','Supernatural legal drama','Political fantasy','Royal family saga','Small-town paranormal','Island mystery','Road-trip fantasy','Epistolary drama'
];

export const ORRERY_OBJECTS=[
'a talking toaster','a broken moon compass','a letter that rewrites itself','an umbrella that remembers storms','a porcelain fox','a key with no lock','a teacup full of stars','a borrowed wedding ring','a clock that runs on secrets','a map drawn in disappearing ink','a library card for a lost city','a mirror that refuses one face',
'a train ticket dated tomorrow','a crown made of salt','a voicemail from the future','a dress with someone else’s memories','a lantern that points toward grief','a suitcase that cannot cross water','a recipe written in a dead language','a photograph with a moving background','a violin missing one impossible string','a houseplant that knows everyone’s name','a snow globe containing the wrong city','a watch that stops during lies',
'a sealed jar of thunder','a book that adds a chapter each night','a hotel key for a demolished room','a pair of shoes that walk home alone','a lighthouse lens in a velvet box','a coin that lands on memories instead of heads','a necklace that grows warm near ghosts','a fountain pen that writes apologies by itself','a theatre mask that changes age','a radio receiving broadcasts from dreams','a wedding invitation with no couple named','a chess piece carved from meteorite',
'a perfume bottle that smells like childhood','a postcard sent from a place that does not exist','a bell that rings before someone vanishes','a suitcase full of identical blue ribbons','a pocket mirror reflecting a different season','a paper crown from an abandoned birthday party','a mechanical bird that only sings warnings','a diary written in two handwritings','a candle that casts someone else’s shadow','a passport stamped by imaginary countries','a spoon engraved with a royal crest','a cassette tape labelled DO NOT REWIND',
'a red thread tied to an empty chair','a cracked phone with one working contact','a pocket watch that counts down to reunions','a scarf that changes colour around danger','a locked music box humming from inside','a bus pass valid in another century','a seashell whispering courtroom testimony','a silver comb that grows flowers in hair','a pair of gloves that remember touch','a receipt for something never purchased','a tiny door hidden inside a wardrobe drawer','a notebook whose margins argue with the writer',
'a glass marble containing a sunrise','a ring that makes promises audible','a bottle of rain collected from one exact night','a funeral program for someone still alive'
];

export const ORRERY_TWISTS=[
'everyone has forgotten how to sit down','the villain is trying to prevent the prophecy','the narrator has been dead for a week','the happiest memory belongs to somebody else','the room changes whenever someone lies','the hero wins in the first scene and regrets it','the prophecy was written as a joke','only strangers remember the protagonist','the love letter is legally binding','the monster is the only reliable witness','midnight lasts for three days','the missing person is attending the search party',
'the person they are rescuing does not want to leave','every apology erases a shared memory','the detective committed the crime in a forgotten timeline','the kingdom already ended and nobody told the court','the ghost is haunting the wrong family','the map becomes accurate only after a betrayal','the wedding is actually a diplomatic hostage exchange','the chosen one is an administrative error','the curse improves one life every time it harms another','the rival has been protecting the protagonist anonymously','the spaceship is homesick','the town is rehearsing the same day for an audience',
'the heir to the throne is a place rather than a person','the diary belongs to the reader','every dream is evidence in an unsolved trial','the apocalypse happened quietly years ago','the villain keeps receiving anonymous help from the hero','the supposedly magical object is ordinary but everyone else is not','the side character has been editing the story','the family tree contains a future descendant','the monster can only enter places where it is loved','the rebellion is funded by the monarchy','the dead can vote but cannot speak','the narrator changes whenever someone falls asleep',
'the love interest remembers every failed version of the relationship','the portal opens only during arguments','the missing city appears whenever nobody is searching for it','the curse is inherited through kindness instead of blood','the hero has already met their future self and hated them','the villain is correct about the central mystery but wrong about everything else','the gods are using customer service tickets','the final battle is a negotiation over inheritance','the haunted house is trying to move away','the secret society is mostly a book club','the anonymous benefactor is the protagonist under another name','the prophecy describes a minor inconvenience with catastrophic wording',
'the murder victim staged the afterlife','every character receives a different ending','the world ends only if the protagonists reconcile','the rival kingdom is fictional propaganda','the treasure is a legal document','the narrator is a building','the magic disappears whenever it is explained','the audience inside the story can vote on what happens next','the villain is someone’s emergency contact','the hero is being remembered by people they have not met yet','the quest reward is custody of a dangerous secret','the final door opens from the other side',
'the person everyone fears is the only one who cannot use magic','the entire mystery began because of a typo','the supposed time traveller is moving through other people’s memories','the monster is protecting the last ordinary thing in the world'
];

export const PROMPT_ORRERY_RECIPES=Array.from({length:1012},(_,i)=>({
 id:'orrery-'+String(i+1).padStart(4,'0'),
 genre:ORRERY_GENRES[i%ORRERY_GENRES.length],
 object:ORRERY_OBJECTS[(i*7+11)%ORRERY_OBJECTS.length],
 twist:ORRERY_TWISTS[(i*13+17)%ORRERY_TWISTS.length]
}));

export function randomOrreryRecipe(previousId=''){
 if(!PROMPT_ORRERY_RECIPES.length)return null;
 let next=PROMPT_ORRERY_RECIPES[Math.floor(Math.random()*PROMPT_ORRERY_RECIPES.length)];
 if(PROMPT_ORRERY_RECIPES.length>1&&next.id===previousId)next=PROMPT_ORRERY_RECIPES[(PROMPT_ORRERY_RECIPES.indexOf(next)+1)%PROMPT_ORRERY_RECIPES.length];
 return next;
}
