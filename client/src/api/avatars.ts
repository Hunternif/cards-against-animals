import bird_001 from "../assets/avatars/bird_001.jpg"
import bird_002 from "../assets/avatars/bird_002.jpg"
import bird_003 from "../assets/avatars/bird_003.jpg"
import bird_004 from "../assets/avatars/bird_004.jpg"
import bird_005 from "../assets/avatars/bird_005.jpg"
import bird_006 from "../assets/avatars/bird_006.jpg"
import bird_007 from "../assets/avatars/bird_007.jpg"
import cat_001 from "../assets/avatars/cat_001.jpg"
import cat_002 from "../assets/avatars/cat_002.jpg"
import cat_003 from "../assets/avatars/cat_003.jpg"
import cat_004 from "../assets/avatars/cat_004.jpg"
import cat_005 from "../assets/avatars/cat_005.jpg"
import cat_006 from "../assets/avatars/cat_006.jpg"
import cat_007 from "../assets/avatars/cat_007.jpg"
import cat_008 from "../assets/avatars/cat_008.jpg"
import cat_009 from "../assets/avatars/cat_009.jpg"
import cat_010 from "../assets/avatars/cat_010.jpg"
import cat_011 from "../assets/avatars/cat_011.jpg"
import cat_012 from "../assets/avatars/cat_012.jpg"
import cat_013 from "../assets/avatars/cat_013.jpg"
import cat_014 from "../assets/avatars/cat_014.jpg"
import cat_015 from "../assets/avatars/cat_015.jpg"
import cat_016 from "../assets/avatars/cat_016.jpg"
import cat_017 from "../assets/avatars/cat_017.jpg"
import cat_018 from "../assets/avatars/cat_018.jpg"
import cat_019 from "../assets/avatars/cat_019.jpg"
import cat_020 from "../assets/avatars/cat_020.jpg"
import cat_021 from "../assets/avatars/cat_021.jpg"
import cat_022 from "../assets/avatars/cat_022.jpg"
import deer_001 from "../assets/avatars/deer_001.jpg"
import deer_002 from "../assets/avatars/deer_002.jpg"
import deer_003 from "../assets/avatars/deer_003.jpg"
import deer_004 from "../assets/avatars/deer_004.jpg"
import dog_001 from "../assets/avatars/dog_001.jpg"
import dog_002 from "../assets/avatars/dog_002.jpg"
import dog_003 from "../assets/avatars/dog_003.jpg"
import dog_004 from "../assets/avatars/dog_004.jpg"
import dog_005 from "../assets/avatars/dog_005.jpg"
import dog_006 from "../assets/avatars/dog_006.jpg"
import dog_007 from "../assets/avatars/dog_007.jpg"
import dog_008 from "../assets/avatars/dog_008.jpg"
import dog_009 from "../assets/avatars/dog_009.jpg"
import dog_010 from "../assets/avatars/dog_010.jpg"
import fox_001 from "../assets/avatars/fox_001.jpg"
import fox_002 from "../assets/avatars/fox_002.jpg"
import fox_003 from "../assets/avatars/fox_003.jpg"
import fox_004 from "../assets/avatars/fox_004.jpg"
import fox_005 from "../assets/avatars/fox_005.jpg"
import goat_001 from "../assets/avatars/goat_001.jpg"
import goat_002 from "../assets/avatars/goat_002.jpg"
import goat_003 from "../assets/avatars/goat_003.jpg"
import goat_004 from "../assets/avatars/goat_004.jpg"
import hamster_001 from "../assets/avatars/hamster_001.jpg"
import hamster_002 from "../assets/avatars/hamster_002.jpg"
import horse_001 from "../assets/avatars/horse_001.jpg"
import lion_001 from "../assets/avatars/lion_001.jpg"
import lion_002 from "../assets/avatars/lion_002.jpg"
import lizard_001 from "../assets/avatars/lizard_001.jpg"
import monkey_001 from "../assets/avatars/monkey_001.jpg"
import monkey_002 from "../assets/avatars/monkey_002.jpg"
import monkey_003 from "../assets/avatars/monkey_003.jpg"
import mouse_001 from "../assets/avatars/mouse_001.jpg"
import mouse_002 from "../assets/avatars/mouse_002.jpg"
import mouse_003 from "../assets/avatars/mouse_003.jpg"
import mouse_004 from "../assets/avatars/mouse_004.jpg"
import otter_001 from "../assets/avatars/otter_001.jpg"
import otter_002 from "../assets/avatars/otter_002.jpg"
import panda_001 from "../assets/avatars/panda_001.jpg"
import panda_002 from "../assets/avatars/panda_002.jpg"
import snake_001 from "../assets/avatars/snake_001.jpg"
import turtle_001 from "../assets/avatars/turtle_001.jpg"
import zebra_001 from "../assets/avatars/zebra_001.jpg"
import cheems_bot from "../assets/avatars/cheems_bot.jpg"
import { RNG } from "@shared/rng"


/** Avatar image that a player can use. */
export class Avatar {
  /** ID referenced in database. Can't allow 3rd party urls. */
  id: string;
  url: string;
  tags: string[] = [];
  constructor(id: string, url: string, tags: string[] = []) {
    this.id = id;
    this.url = url;
    this.tags = tags;
  }
}

/** All currently available avatars */
export const playerAvatars = [
  new Avatar("bird_001", bird_001, ["bird"]),
  new Avatar("bird_002", bird_002, ["bird"]),
  new Avatar("bird_003", bird_003, ["bird"]),
  new Avatar("bird_004", bird_004, ["bird"]),
  new Avatar("bird_005", bird_005, ["bird"]),
  new Avatar("bird_006", bird_006, ["bird"]),
  new Avatar("bird_007", bird_007, ["bird"]),
  new Avatar("cat_001", cat_001, ["cat"]),
  new Avatar("cat_002", cat_002, ["cat"]),
  new Avatar("cat_003", cat_003, ["cat"]),
  new Avatar("cat_004", cat_004, ["cat"]),
  new Avatar("cat_005", cat_005, ["cat"]),
  new Avatar("cat_006", cat_006, ["cat"]),
  new Avatar("cat_007", cat_007, ["cat"]),
  new Avatar("cat_008", cat_008, ["cat"]),
  new Avatar("cat_009", cat_009, ["cat"]),
  new Avatar("cat_010", cat_010, ["cat"]),
  new Avatar("cat_011", cat_011, ["cat"]),
  new Avatar("cat_012", cat_012, ["cat"]),
  new Avatar("cat_013", cat_013, ["cat"]),
  new Avatar("cat_014", cat_014, ["cat"]),
  new Avatar("cat_015", cat_015, ["cat"]),
  new Avatar("cat_016", cat_016, ["cat"]),
  new Avatar("cat_017", cat_017, ["cat"]),
  new Avatar("cat_018", cat_018, ["cat"]),
  new Avatar("cat_019", cat_019, ["cat"]),
  new Avatar("cat_020", cat_020, ["cat"]),
  new Avatar("cat_021", cat_021, ["cat"]),
  new Avatar("cat_022", cat_022, ["cat"]),
  new Avatar("deer_001", deer_001, ["deer"]),
  new Avatar("deer_002", deer_002, ["deer"]),
  new Avatar("deer_003", deer_003, ["deer"]),
  new Avatar("deer_004", deer_004, ["deer"]),
  new Avatar("dog_001", dog_001, ["dog"]),
  new Avatar("dog_002", dog_002, ["dog"]),
  new Avatar("dog_003", dog_003, ["dog"]),
  new Avatar("dog_004", dog_004, ["dog"]),
  new Avatar("dog_005", dog_005, ["dog"]),
  new Avatar("dog_006", dog_006, ["dog"]),
  new Avatar("dog_007", dog_007, ["dog"]),
  new Avatar("dog_008", dog_008, ["dog"]),
  new Avatar("dog_009", dog_009, ["dog"]),
  new Avatar("dog_010", dog_010, ["dog"]),
  new Avatar("fox_001", fox_001, ["fox"]),
  new Avatar("fox_002", fox_002, ["fox"]),
  new Avatar("fox_003", fox_003, ["fox"]),
  new Avatar("fox_004", fox_004, ["fox"]),
  new Avatar("fox_005", fox_005, ["fox"]),
  new Avatar("goat_001", goat_001, ["goat"]),
  new Avatar("goat_002", goat_002, ["goat"]),
  new Avatar("goat_003", goat_003, ["goat"]),
  new Avatar("goat_004", goat_004, ["goat"]),
  new Avatar("hamster_001", hamster_001, ["hamster"]),
  new Avatar("hamster_002", hamster_002, ["hamster"]),
  new Avatar("horse_001", horse_001, ["horse"]),
  new Avatar("lion_001", lion_001, ["lion"]),
  new Avatar("lion_002", lion_002, ["lion"]),
  new Avatar("lizard_001", lizard_001, ["lizard"]),
  new Avatar("monkey_001", monkey_001, ["monkey"]),
  new Avatar("monkey_002", monkey_002, ["monkey"]),
  new Avatar("monkey_003", monkey_003, ["monkey"]),
  new Avatar("mouse_001", mouse_001, ["mouse"]),
  new Avatar("mouse_002", mouse_002, ["mouse"]),
  new Avatar("mouse_003", mouse_003, ["mouse"]),
  new Avatar("mouse_004", mouse_004, ["mouse"]),
  new Avatar("otter_001", otter_001, ["otter"]),
  new Avatar("otter_002", otter_002, ["otter"]),
  new Avatar("panda_001", panda_001, ["panda"]),
  new Avatar("panda_002", panda_002, ["panda"]),
  new Avatar("snake_001", snake_001, ["snake"]),
  new Avatar("turtle_001", turtle_001, ["turtle"]),
  new Avatar("zebra_001", zebra_001, ["zebra"]),
];

export const botAvatars = [
  new Avatar("cheems_bot", cheems_bot, ["bot", "dog"]),
]

/** Avatars mapped by id */
export const avatarMap: Map<string, Avatar> =
  new Map([...playerAvatars, ...botAvatars].map((a) => [a.id, a]));

/** Returns a random avatar to be used until the user logs in */
export function randomPlayerAvatarID(rng: RNG = RNG.fromTimestamp()): string {
  const index = rng.randomIntClamped(0, playerAvatars.length - 1);
  return Array.from(avatarMap.keys())[index];
}

/** Returns a random avatar */
export function randomPlayerAvatar(rng: RNG = RNG.fromTimestamp()): Avatar {
  const index = rng.randomIntClamped(0, playerAvatars.length - 1);
  return playerAvatars.at(index) ?? playerAvatars[0];
}