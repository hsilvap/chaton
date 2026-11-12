// A session the user has set up. For now it's just a directory;
// later it gets a PTY, selected skills, and a live status.
export type Session = {
  id: string;
  dir: string;
};
