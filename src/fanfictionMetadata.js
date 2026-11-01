/**
 * Curated discovery metadata, separate from the works themselves.
 * Source ratings are translated into the Palace's age classes:
 * FFN K/K+ -> general, FFN T / AO3 Teen -> teen, FFN M -> mature.
 * Absence of a documented rating stays "not_rated", never inferred.
 * Tags and warnings are descriptive editorial metadata, not author claims.
 */
const entry=(rating,sourceRating,tags,warnings=[],basis=rating==='not_rated'?'unrated':'source')=>Object.freeze({
 rating,sourceRating,ratingBasis:basis,contentWarnings:warnings,
 tags:Object.entries(tags).flatMap(([category,names])=>names.map(name=>({category,name})))
});
export const MODERN_FANFICTION_GUIDES=Object.freeze({
 'anime-animeisperfection-frozen-heart':entry('general','FanFiction.net K',{fandom:['Ouran High School Host Club'],format:['Anime & Manga'],genre:['Romance','Friendship'],trope:['One-Shot','Original Character','Childhood Friends','Identity'],character:['Kaoru Hitachiin','Hikaru Hitachiin','Haruhi Fujioka']}),
 'anime-animeisperfection-synchronicity':entry('teen','FanFiction.net T',{fandom:['Vocaloid','Synchronicity'],format:['Anime-Inspired'],genre:['Fantasy','Romance'],trope:['Dragons','Rescue','Royal Courts'],character:['Len Kagamine','Rin Kagamine','Miku Hatsune','Akane Kiyomizu'],warning:['Child Separation','Death']},['Child separation','Death references','Dragon violence']),
 'anime-animeisperfection-together-tomorrow':entry('teen','FanFiction.net T',{fandom:['Naruto'],format:['Anime & Manga'],genre:['Romance','Family'],trope:['Alternate Ending','One-Shot','War Aftermath'],character:['Sasuke Uchiha','Tenten','Naruto Uzumaki'],relationship:['Sasuke/Tenten'],warning:['Major Character Death']},['Major character death','War aftermath']),
 'anime-primulad-platos-rotos':entry('general','FanFiction.net K+',{fandom:['Naruto'],format:['Anime & Manga'],language:['Spanish'],genre:['Friendship','Drama'],trope:['One-Shot','Heart-to-Heart'],character:['Sakura Haruno','Ino Yamanaka','Temari']}),
 'anime-lalunaticscribe-restructer-revolution':entry('teen','FanFiction.net T',{fandom:['One Piece','Yu-Gi-Oh! 5D’s'],format:['Anime & Manga'],genre:['Supernatural','Humour','Adventure'],trope:['Crossover','Isekai','Found Family'],character:['Yusei Fudo','Monkey D. Luffy','Straw Hat Pirates']}),
 'anime-lalunaticscribe-huge-revolution':entry('teen','FanFiction.net T',{fandom:['One Piece','Yu-Gi-Oh! 5D’s'],format:['Anime & Manga'],genre:['Adventure','Humour'],trope:['Crossover','Sequel','New World'],character:['Yusei Fudo','Aki Izayoi','Straw Hat Pirates']}),
 'anime-lalunaticscribe-stardust-shimmer':entry('teen','FanFiction.net T',{fandom:['Yu-Gi-Oh! 5D’s','Justice League'],format:['Anime & Manga'],genre:['Supernatural','Drama'],trope:['Crossover','Mystery','Post-Canon'],character:['Yusei Fudo','Batman','Justice League']}),
 'anime-primulad-sin-milagro':entry('mature','FanFiction.net M',{fandom:['Neon Genesis Evangelion'],format:['Anime & Manga'],language:['Spanish'],genre:['Angst','Drama'],trope:['One-Shot','Relationship Retrospective'],character:['Misato Katsuragi','Ryoji Kaji'],relationship:['Misato/Kaji'],warning:['Mature Themes']},['Mature relationship themes','Angst']),
 'anime-primulad-el-secreto-touya':entry('mature','FanFiction.net M',{fandom:['Cardcaptor Sakura'],format:['Anime & Manga'],language:['Spanish'],genre:['Romance','Drama'],trope:['One-Shot','Supernatural Secrets'],character:['Touya Kinomoto','Yukito Tsukishiro'],relationship:['Touya/Yukito'],warning:['Mature Themes']},['Mature relationship themes']),
 'anime-primulad-persiguiendo-sueno':entry('mature','FanFiction.net M',{fandom:['Naruto'],format:['Anime & Manga'],language:['Spanish'],genre:['Adventure','Friendship'],trope:['ANBU','Prequel','Kunoichi'],character:['Yūgao Uzuki','Kakashi Hatake'],warning:['Violence','War']},['Violence','War','Adult themes']),
 'anime-michaelzorch-wtf':entry('mature','FanFiction.net M',{fandom:['Naruto'],format:['Anime & Manga'],genre:['Humour','Adventure'],trope:['Alternate Universe','Forbidden Techniques','Harem'],character:['Naruto Uzumaki','Jiraiya','Hinata Hyuga'],warning:['Adult Themes','Sexual Innuendo','Strong Language']},['Adult themes','Sexual innuendo','Strong language']),
 'anime-anloyalfriend-idiots-walk':entry('mature','FanFiction.net M',{fandom:['My Hero Academia'],format:['Anime & Manga'],genre:['Humour','Action'],trope:['Self-Insert','Reincarnation','Wish Fulfillment','Crossover'],character:['Izuku Midoriya','Momo Yaoyorozu','Shota Aizawa'],warning:['Violence','Strong Language','Bullying']},['Violence','Strong language','Bullying']),
 'anime-lalunaticscribe-exchange-spirit':entry('teen','FanFiction.net T',{fandom:['Yu-Gi-Oh!','Bleach'],format:['Anime & Manga'],genre:['Supernatural','Drama'],trope:['Crossover','Mystery','One-Shot'],character:['Marik Ishtar','Jūshirō Ukitake'],warning:['Illness','Danger']},['Illness','Supernatural threats']),
 'dawn-yule-lights':entry('not_rated',null,{fandom:['The Silmarillion'],genre:['Fantasy','Drama'],trope:['Winter Holidays','Family Memories'],character:['Celebrimbor','Annatar']}),
 'dawn-home-alone':entry('not_rated',null,{fandom:['The Silmarillion','Home Alone'],genre:['Fantasy','Humour'],trope:['Crossover','Family','Winter Holidays'],character:['Amrod','Amras']}),
 'dawn-ordinary-woman':entry('not_rated',null,{fandom:['The Silmarillion'],genre:['Fantasy','Drama'],trope:['Canon Divergence','Family'],character:['Lúthien','Finrod']}),
 'blackwidower-twilights-endgame':entry('teen','Fimfiction Teen',{fandom:['My Little Pony','Marvel Avengers'],genre:['Sci-Fi','Adventure'],trope:['Crossover','Post-Apocalypse'],character:['Twilight Sparkle'],warning:['Violence','Death']},['Violence','Death','Grief']),
 'morganaw-cunning-and-compromise':entry('teen','AO3 Teen (FanFiction.net K+)',{fandom:['Pride and Prejudice'],genre:['Romance','Historical'],trope:['Alternate Universe','Canon Divergence','Intrigue'],character:['Elizabeth Bennet','Fitzwilliam Darcy','George Wickham']}),
 'morganaw-more-justified-in-acting':entry('teen','AO3 Teen',{fandom:['Persuasion'],genre:['Romance','Drama'],trope:['Canon Divergence','Second Chances'],character:['Anne Elliot','Captain Wentworth']}),
 'squibstress-sweep':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Drama'],trope:['Post-War','Character Study'],character:['Argus Filch'],warning:['War Aftermath','Blood','Death']},['War aftermath','Blood','Death references']),
 'squibstress-perils-of-eavesdropping':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Humour'],trope:['One-Shot','Pranks'],character:['Fred Weasley','George Weasley']}),
 'squibstress-not-so-rough-wooing':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Romance','Humour'],trope:['One-Shot','Valentine’s Day'],character:['Albus Dumbledore','Minerva McGonagall']}),
 'simplynia-irresistible':entry('teen','FanFiction.net T',{fandom:['The Vampire Diaries'],genre:['Romance','Angst'],trope:['Human AU','Power Dynamics'],character:['Bonnie Bennett','Elijah Mikaelson'],relationship:['Bonnie/Elijah'],warning:['Dom/Sub Undertones']},['Dom/sub undertones','Angst']),
 'blackwidower-my-little-destiny':entry('teen','FanFiction.net T',{fandom:['My Little Pony','Stargate Universe'],genre:['Adventure','Sci-Fi'],trope:['Crossover','Space Travel']}),
 'blackwidower-a-waking-dragon':entry('teen','FanFiction.net T',{fandom:['My Little Pony','Awake'],genre:['Romance','Fantasy'],trope:['Crossover','Alternate Realities'],character:['Spike'],warning:['Grief','Loss']},['Grief','Loss']),
 'alixe-les-survivants':entry('not_rated',null,{fandom:['Harry Potter'],genre:['Fantasy','Drama'],trope:['Post-War','Future Fic'],language:['French']}),
 'starholder-song-of-lost-heart':entry('general','FanFiction.net K',{fandom:['Yu-Gi-Oh!'],genre:['Poetry'],trope:['Fan Poem','Hope'],character:['Atem','Yugi']}),
 'morganaw-depravity-comparison':entry('teen','FanFiction.net T',{fandom:['Pride and Prejudice','Sense and Sensibility'],genre:['Drama','Romance'],trope:['Crossover','Social Justice'],character:['Elizabeth Darcy','Margaret Dashwood']}),
 'morganaw-paws-and-prejudice':entry('general','FanFiction.net K+',{fandom:['Pride and Prejudice'],genre:['Romance','Humour'],trope:['Modern AU','Pets','Meet-Cute'],character:['Elizabeth Bennet','Fitzwilliam Darcy']}),
 'cateliot-inner-demons':entry('teen','FanFiction.net T',{fandom:['Percy Jackson and the Olympians'],genre:['Angst','Hurt/Comfort'],trope:['One-Shot','Pre-Canon','Found Family'],character:['Annabeth Chase','Thalia Grace','Luke Castellan'],warning:['Past Trauma','Scars']},['Trauma and scarring']),
 'what-contented-men-desire-last-adventure':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Adventure','Romance'],trope:['Post-War','Alternate Ending'],character:['Harry Potter','Hermione Granger','Ron Weasley'],warning:['War Aftermath','Violence']},['War aftermath','Violence']),
 'mjware-american-muggle':entry('general','FanFiction.net K',{fandom:['Harry Potter'],genre:['Adventure','Romance'],trope:['Original Character','Magic School','Slytherin']}),
 'greame-nevernever-story':entry('teen','FanFiction.net T',{fandom:['The Dresden Files'],genre:['Adventure','Supernatural'],trope:['Original Character','Quest'],warning:['Violence']},['Violence']),
 'jrush-v-for-vengeance':entry('teen','FanFiction.net T',{fandom:['The Dresden Files'],genre:['Horror','Supernatural'],trope:['Vampires','Danger'],character:['Harry Dresden'],warning:['Violence','Horror']},['Supernatural violence','Horror']),
 'ken1245632-naruto-dragon-chronicles':entry('mature','FanFiction.net M',{fandom:['Naruto','Dark Souls'],genre:['Adventure','Sci-Fi'],trope:['Crossover','Alternate Universe'],character:['Naruto Uzumaki','Priscilla'],warning:['Dark Themes','Violence']},['Violence','Dark fantasy']),
 'watchword-summer-for-saya':entry('mature','FanFiction.net M',{fandom:['Teenage Mutant Ninja Turtles'],genre:['Drama','Family'],trope:['Family Secrets','Coming of Age','Canon Divergence'],warning:['Extreme Violence','Family Abuse','Psychological Abuse']},['Extreme violence','Family abuse','Psychological abuse']),
 'watchword-only-man':entry('mature','FanFiction.net T (Palace 18+ precaution)',{fandom:['BioShock'],genre:['Sci-Fi','Horror','Drama'],trope:['Novelization','Survival','Dystopia'],character:['Jack Ryan'],warning:['Extreme Violence','Sexual Assault','Child Abuse','Drug Abuse','Torture','Bigotry']},['Extreme violence','Sexual assault','Child abuse','Drug abuse','Torture','Hateful language'],'editorial'),
 'sittscho-rwbynov-volume-one':entry('teen','FanFiction.net T',{fandom:['RWBY'],genre:['Romance','Friendship'],trope:['Novelization','Slice of Life','Canon Expansion'],character:['Ruby Rose','Weiss Schnee','Blake Belladonna','Yang Xiao Long'],relationship:['Blake Belladonna/Yang Xiao Long']}),
 'svensons-vikings-thing':entry('teen','FanFiction.net T',{fandom:['How to Train Your Dragon','Frozen'],genre:['Fantasy','Adventure'],trope:['Crossover','Sequel','Vikings'],character:['Hiccup','Astrid','Anna','Elsa']}),
 'lancer47-what-happened-here':entry('teen','FanFiction.net T',{fandom:['Buffy the Vampire Slayer','Stargate SG-1'],genre:['Adventure','Romance'],trope:['Crossover','Post-Canon'],character:['Willow Rosenberg','Dawn Summers','Daniel Jackson'],warning:['Strong Language']},['Occasional strong language']),
 'squibstress-one-to-keep-an-eye-on':entry('general','FanFiction.net K',{fandom:['Harry Potter'],genre:['Family','Friendship'],trope:['Pre-Canon','School Days','One-Shot'],character:['Minerva McGonagall','Albus Dumbledore']}),
 'squibstress-natural-law':entry('general','FanFiction.net K+',{fandom:['Harry Potter'],genre:['Drama','Political'],trope:['Character Study','Social Commentary'],character:['Minerva McGonagall','Winky','Barty Crouch Sr'],warning:['Discrimination','Family Grief']},['Discriminatory views debated','Family grief']),
 'squibstress-bonnie-wee-thing':entry('general','FanFiction.net K',{fandom:['Harry Potter'],genre:['Family','Fluff'],trope:['Pre-Canon','Babyfic','One-Shot'],character:['Minerva McGonagall']}),
 'squibstress-de-aegypto':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Romance','Drama'],trope:['Reunion','Second Chances','One-Shot'],character:['Minerva McGonagall','Rolanda Hooch'],relationship:['Minerva McGonagall/Rolanda Hooch']}),
 'merlintirianius-obligations':entry('general','FanFiction.net K',{fandom:['The Dresden Files'],genre:['Fantasy'],trope:['Faerie Courts','Family','Duty'],character:['Harry Dresden','Mab','Maggie Dresden']}),
 'hushbugger-the-long-night':entry('teen','FanFiction.net T',{fandom:['Outer Wilds'],genre:['Sci-Fi','Adventure'],trope:['Space Exploration','Time Loop','Survival'],character:['Chert','Feldspar','Riebeck'],warning:['Existential Dread']},['Existential peril','Cosmic catastrophe']),
 'hushbugger-yet-here-i-remain':entry('general','FanFiction.net K',{fandom:['Hollow Knight'],genre:['Friendship','Drama'],trope:['Recovery','Found Family','Post-Canon'],character:['Sly','Myla'],warning:['Illness']},['Infection and recovery']),
 'hushbugger-socrates-in-the-caves':entry('general','FanFiction.net K',{fandom:['Undertale','Classical Philosophy'],genre:['Humour','Fantasy'],trope:['Crossover','Fish Out of Water','Philosophical Debate'],character:['Socrates','Papyrus','Undyne','Toriel']}),
 'hushbugger-human-habits':entry('general','FanFiction.net K',{fandom:['Deltarune'],genre:['Family','Humour'],trope:['One-Shot','Slice of Life','Childhood'],character:['Kris Dreemurr','Asriel Dreemurr','Asgore']}),
 'robinwingster-bobbin-around':entry('teen','FanFiction.net T',{fandom:['Batman','DC Comics'],genre:['Hurt/Comfort','Family'],trope:['Found Family','Early Robin','One-Shot'],character:['Dick Grayson','Bruce Wayne','Alfred Pennyworth'],warning:['Grief','Childhood Trauma']},['Bereavement','Emotional distress']),
 'scyllaya-bend-around-the-wind':entry('mature','FanFiction.net M (author NC-17)',{fandom:['Marvel Avengers'],genre:['Sci-Fi','Romance'],trope:['Enemies to Allies','Forced Proximity','Space Travel'],character:['Tony Stark','Loki'],relationship:['Tony Stark/Loki'],warning:['Sexual Content','Violence']},['Adult sexual content','Violence','Mature themes']),
 'lordtrychon-a-sith-by-any-other-name':entry('teen','FanFiction.net T',{fandom:['Star Wars'],genre:['Sci-Fi','Adventure'],trope:['Amnesia','Lost Love','Side Story'],character:['Original Sith Character']}),
 'jtheclivaz-every-day-the-same-nightmare':entry('teen','FanFiction.net T',{fandom:['Mass Effect'],genre:['Hurt/Comfort','Romance'],trope:['Trauma Recovery','Post-Akuze','Female Shepard'],character:['Commander Shepard','Ashley Williams'],warning:['Strong Language','Psychological Trauma']},['Strong language','Psychological distress']),
 'nemebean-mom':entry('general','FanFiction.net K',{fandom:['The Dresden Files'],genre:['Humour','Fantasy'],trope:['Family Outing','One-Shot'],character:['Mab'],warning:['Canon Spoilers']},['Spoilers for Cold Days']),
 'perspicacity-riding-the-l':entry('teen','FanFiction.net T',{fandom:['The Dresden Files'],genre:['Humour','Supernatural'],trope:['Canon Speculation','One-Shot'],character:['Harry Dresden'],warning:['Canon Spoilers']},['Major spoilers for Changes']),
 'griffyn612-lost-boys-dresdenverse':entry('teen','FanFiction.net T',{fandom:['Peter Pan','The Dresden Files'],genre:['Fantasy','Tragedy'],trope:['Crossover','Dark Retelling','Vengeance'],character:['Captain Hook','Peter Pan'],warning:['Dark Themes','Violence']},['Dark themes','Revenge','Supernatural danger']),
 'siriuslyfun19212-alive':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Angst','Drama'],trope:['One-Shot','Family Conflict'],character:['Remus Lupin'],warning:['Discrimination','Childhood Trauma']},['Anti-werewolf prejudice','Family conflict']),
 'morganaw-you-could-have-googled-me':entry('general','FanFiction.net K+',{fandom:['The Lizzie Bennet Diaries','Pride and Prejudice'],genre:['Romance'],trope:['Alternate Timeline','Internet Discovery','What If'],character:['Elizabeth Bennet','William Darcy'],relationship:['Elizabeth Bennet/William Darcy']}),
 'morganaw-revelations-outwood':entry('general','FanFiction.net K+',{fandom:['North and South'],genre:['Romance','Hurt/Comfort'],trope:['Canon Divergence','Rescue','Misunderstandings'],character:['Margaret Hale','John Thornton','Frederick Hale']}),
 'morganaw-doctor-persuasion':entry('general','FanFiction.net K',{fandom:['Persuasion'],genre:['Romance','Hurt/Comfort'],trope:['Canon Divergence','Medical Care','Recovery'],character:['Anne Elliot','Admiral Croft','Sophia Croft'],warning:['Injury']},['Minor injury','Medical care']),
 'morganaw-defenses-down':entry('general','FanFiction.net K',{fandom:['The Lizzie Bennet Diaries','Pride and Prejudice'],genre:['Romance','Hurt/Comfort'],trope:['Sickfic','Caretaking','Canon Divergence'],character:['Elizabeth Bennet','William Darcy'],warning:['Illness']},['Illness']),
 'morganaw-defamation':entry('general','FanFiction.net K+',{fandom:['The Lizzie Bennet Diaries','Pride and Prejudice'],genre:['Romance','Drama'],trope:['Legal Dispute','Modern AU','Misunderstandings'],character:['Elizabeth Bennet','William Darcy']}),
 'morganaw-no-use-playing-dumb':entry('teen','FanFiction.net T',{fandom:['Daria'],genre:['Romance','Humour'],trope:['Romantic Misunderstanding','Confession','Character Study'],character:['Daria Morgendorffer','Trent Lane','Tom Sloane'],relationship:['Daria/Trent']}),
 'morganaw-tethered':entry('mature','FanFiction.net M',{fandom:['The Magicians'],genre:['Romance','Supernatural'],trope:['Alternate Timeline','Cooperative Magic','Grief','Healing'],character:['Quentin Coldwater','Alice Quinn','Eliot Waugh','Fen'],warning:['Grief','Illness','Mature Romance']},['Grief','Illness','Mature romantic themes']),
 'morganaw-crash':entry('teen','FanFiction.net T',{fandom:['Emma Approved'],genre:['Hurt/Comfort','Romance'],trope:['Modern AU','Miscommunication','Recovery'],character:['Emma Woodhouse','Alex Knightley'],warning:['Road Accident','Injury']},['Road accident','Injury','Emotional distress']),
 'blackwidower-princess-last-resort':entry('teen','FanFiction.net T',{fandom:['My Little Pony','Designated Survivor'],genre:['Drama','Tragedy'],trope:['Crossover','Political Succession','Survivor Guilt'],character:['Apple Bloom','Twilight Sparkle','Scootaloo'],warning:['Mass Casualties','Death','Grief']},['Mass-casualty attack','Death','Grief']),
 'squibstress-exotic-matter':entry('mature','FanFiction.net M',{fandom:['Harry Potter'],genre:['Drama','Romance'],trope:['Time Travel','Secret History','Biography'],character:['Hermione Granger','Ron Weasley','Minerva McGonagall','Severus Snape'],relationship:['Minerva McGonagall/Severus Snape'],warning:['Death','Grief','Mature Themes']},['Death','Grief','Mature themes']),
 'lalunaticscribe-shadow-game':entry('teen','FanFiction.net T',{fandom:['Sherlock','Yu-Gi-Oh!'],genre:['Supernatural','Humour','Mystery'],trope:['Crossover','Magic John','Occult Mystery'],character:['Sherlock Holmes','John Watson','Bakura'],warning:['Murder','Threats']},['Murder references','Occult threats']),
 'lalunaticscribe-adventure-man-of-d':entry('teen','FanFiction.net T',{fandom:['Sherlock Holmes','One Piece'],genre:['Supernatural','Mystery'],trope:['Crossover','Time Travel','Fish Out of Water'],character:['Sherlock Holmes','Monkey D. Luffy','Straw Hat Pirates'],warning:['Peril']},['Supernatural danger']),
 'lastgoodname-a-storybook-story':entry('general','FanFiction.net K',{fandom:['The Princess Bride'],genre:['Humour','Adventure'],trope:['Post-Canon','Happy Ending','One-Shot'],character:['Westley','Buttercup','Inigo Montoya','Fezzik'],warning:['Non-Graphic Injury']},['Non-graphic injury']),
 'lastgoodname-stonewalling':entry('general','FanFiction.net K',{fandom:['The Devil Wears Prada'],genre:['Friendship','Romance'],trope:['Coming Out','Relationship Privacy','One-Shot'],character:['Andrea Sachs','Miranda Priestly','Nigel'],relationship:['Andy/Miranda']}),
 'lastgoodname-failure-communicate':entry('general','FanFiction.net K',{fandom:['The Devil Wears Prada'],genre:['Romance','Humour'],trope:['Miscommunication','One-Shot'],character:['Miranda Priestly']}),
 'lastgoodname-72-days-counting':entry('teen','FanFiction.net T',{fandom:['The Devil Wears Prada'],genre:['Romance','Drama'],trope:['Time Loop','Second Chances','One-Shot'],warning:['Repeated Distress']},['Repeated distress']),
 'lastgoodname-what-little-girls-made-of':entry('general','FanFiction.net K+',{fandom:['Buffy the Vampire Slayer'],genre:['Humour','Romance'],trope:['Birthday','One-Shot','Gifts'],character:['Buffy Summers','Faith Lehane'],relationship:['Buffy/Faith']}),
 'lastgoodname-four-conversations':entry('teen','FanFiction.net T',{fandom:['Buffy the Vampire Slayer'],genre:['Romance','Drama'],trope:['One-Shot','Relationship Talk','Character Study'],character:['Faith Lehane','Willow Rosenberg'],relationship:['Faith/Willow']}),
 'lastgoodname-kristy-horrible-breakup':entry('teen','FanFiction.net T',{fandom:['The Baby-Sitters Club'],genre:['Humour','Romance'],trope:['Breakup','Friends to Lovers','One-Shot'],character:['Kristy Thomas','Stacey McGill','Sam Thomas']}),
 'lastgoodname-it-could-work':entry('general','FanFiction.net K+',{fandom:['Stargate Atlantis'],genre:['Humour','Sci-Fi'],trope:['Microfiction','One-Shot','Disagreement'],character:['Rodney McKay','Radek Zelenka']}),
 'simplynia-to-catch-a-duke':entry('general','FanFiction.net K+',{fandom:['The Vampire Diaries','Bridgerton'],genre:['Romance','Fantasy'],trope:['Regency AU','Courtship','Magic','Complete'],character:['Bonnie Bennett','Klaus Mikaelson'],relationship:['Bonnie/Klaus']}),
 'simplynia-reckless-abandon':entry('teen','FanFiction.net T',{fandom:['The Vampire Diaries'],genre:['Drama','Hurt/Comfort'],trope:['High Society','Romantic Conflict','Alternate Universe'],character:['Bonnie Bennett','Klaus Mikaelson','Rebekah Mikaelson'],relationship:['Bonnie/Klaus']}),
 'simplynia-the-forgery':entry('general','FanFiction.net K',{fandom:['The Vampire Diaries'],genre:['Drama','Romance'],trope:['Modern AU','Forged Art','Secret Service'],character:['Bonnie Bennett','Klaus Mikaelson'],relationship:['Bonnie/Klaus']}),
 'simplynia-ides-of-march':entry('general','FanFiction.net K+',{fandom:['The Vampire Diaries'],genre:['Tragedy','Hurt/Comfort'],trope:['Ominous Prophecy','Complete','Angst'],character:['Bonnie Bennett','Klaus Mikaelson','Damon Salvatore','Kai Parker'],relationship:['Bonnie/Klaus']},['Tragedy'])
});
export const HISTORICAL_FANFICTION_GUIDES=Object.freeze({
 'the-adventure-of-the-two-collaborators-j-m-barrie':entry('general','Palace editorial guide',{fandom:['Sherlock Holmes'],genre:['Parody','Humour'],trope:['Literary Satire','One-Shot'],character:['Sherlock Holmes','John Watson']},[],'editorial'),
 'old-friends-and-new-fancies-sybil-g-brinton':entry('not_rated',null,{fandom:['Jane Austen','Pride and Prejudice','Emma','Mansfield Park'],genre:['Romance','Historical'],trope:['Sequel','Shared Universe','Ensemble Cast'],character:['Elizabeth Darcy','Georgiana Darcy']},[],'unrated')
});
export const FANFICTION_RATINGS=Object.freeze([
 {id:'all',label:'All ratings'},
 {id:'general',label:'General'},
 {id:'teen',label:'Teen (13+)'},
 {id:'mature',label:'Mature (18+)'},
 {id:'explicit',label:'Explicit (18+)'},
 {id:'not_rated',label:'Not rated'}
]);
const fallback=entry('not_rated',null,{},[],'unrated');
export function modernFanfictionGuide(work){return MODERN_FANFICTION_GUIDES[work?.id]||fallback}
export function historicFanfictionGuide(work){return HISTORICAL_FANFICTION_GUIDES[work?.slug]||fallback}
export function fanfictionRatingLabel(guide){
 const title={general:'General',teen:'Teen',mature:'Mature',explicit:'Explicit',not_rated:'Not rated'}[guide?.rating]||'Not rated';
 return guide?.ratingBasis==='editorial'?title+' · Palace guide':title;
}
export function archiveFanfictionTags(work){
 const info=historicFanfictionGuide(work);
 return info.tags.map((tag,index)=>({tags:{
  id:'archive-ff-'+String(work.slug||'unknown')+'-'+index,
  name:tag.name,category:tag.category,status:'canonical'
 }}));
}
export function fanfictionSearchText(work){
 const info=modernFanfictionGuide(work);
 return [work?.title,work?.creator,work?.fandom,work?.description,
  ...info.tags.map(t=>t.name),...info.contentWarnings].filter(Boolean).join(' ').toLowerCase();
}
const ANIME_FANDOM_NAMES=[
 'naruto','one piece','yu-gi-oh','bleach','cardcaptor sakura','card captor sakura',
 'ouran high school host club','neon genesis evangelion','evangelion',
 'my hero academia','vocaloid','tsubasa chronicle','fullmetal alchemist',
 'inuyasha','death note','demon slayer','attack on titan','dragon ball'
];
export function isAnimeFanfiction(work){
 const guide=modernFanfictionGuide(work);
 if(guide.tags.some(tag=>tag.category==='format'&&['Anime & Manga','Anime-Inspired'].includes(tag.name)))return true;
 const names=guide.tags.filter(tag=>tag.category==='fandom').map(tag=>tag.name.toLowerCase());
 return names.some(name=>ANIME_FANDOM_NAMES.some(term=>name.includes(term)));
}
/** Match by credited fandom tag, not any incidental word in a summary.
 * Fandom Atlas uses real selected tag names; these links are never converted
 * into member-published stories or assigned database tag IDs.
 */
const normalizedFandom=name=>String(name||'').normalize('NFKD').toLowerCase()
 .replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function matchesFanfictionFandom(work,fandomName){
 const target=normalizedFandom(fandomName);
 if(!target)return false;
 const names=modernFanfictionGuide(work).tags.filter(t=>t.category==='fandom')
  .map(t=>normalizedFandom(t.name));
 return names.some(name=>name===target||name.startsWith(target+' ')||target.startsWith(name+' '));
}
export function filterModernFanfiction(works=[],{rating='all',query='',animeOnly=false,fandomNames=[],fandomMatch='any'}={}){
 const needle=String(query||'').trim().toLowerCase();
 const selected=Array.isArray(fandomNames)?fandomNames.filter(Boolean):[];
 return works.filter(work=>(rating==='all'||modernFanfictionGuide(work).rating===rating)
   &&(!animeOnly||isAnimeFanfiction(work))
   &&(!selected.length||(fandomMatch==='all'?selected.every(name=>matchesFanfictionFandom(work,name)):selected.some(name=>matchesFanfictionFandom(work,name))))
   &&(!needle||fanfictionSearchText(work).includes(needle)));
}
