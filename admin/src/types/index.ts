export type DramaCategory = "serious" | "romance";

export type Dynasty = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  display_order: number;
  parent_id: string | null;
  track: string;
  color: string;
};

export type Platform = {
  name: string;
  url: string;
};

export type Drama = {
  id: string;
  title: string;
  category: DramaCategory;
  douban_rating: number | null;
  douban_rating_count: number | null;
  episode_count: number;
  release_year: number;
  story_start_year: number;
  story_end_year: number;
  dynasty_id: string;
  historical_anchor: string;
  core_tension: string;
  poster_url: string | null;
  platforms: Platform[];
};
