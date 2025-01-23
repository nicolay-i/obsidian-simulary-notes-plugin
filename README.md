# Similar Notes Search Plugin for Obsidian

Implements a right panel with a list of similar notes. Clicking on a note opens it for viewing.

## Plugin Settings

- Excluded Folders - comma-separated folders that will be ignored during search
- Minimum Note Length - minimum number of characters in a note to be considered in the search

## Development

- `npm install` - install dependencies
- `npm run dev` - build the plugin. The command builds the main.js file and copies it to the plugin root
- `npm run build` - build the plugin. The command builds the main.js file and copies it to the plugin root
- `npm run version` - bump the version of the plugin

## What is it?

### Background

Obsidian has well-developed functionality for linking notes: backlinks, adding links to note properties, mentions, graph view, etc.

However, it's difficult to find connections between notes that would be useful for organizing your digital garden.

The most accessible solution is searching by note title and aliases.

But often, what we remember while reading the current note's text isn't so consonant that we can recall there was another note on this topic. Or that it somehow intersects with this note. This becomes especially noticeable when the number of notes becomes quite large.

### Research

In theory, you could use the graph view to solve this issue. But personally, I find this inconvenient in the context of searching for notes that could be linked to the current note.

Also, in theory, this could be solved through LLM - for example, Obsidian Copilot is supposed to do this.
Setting aside the plugin's functionality, it's difficult to trust an external service with such a personal matter and allow a third-party service to read the text of all notes.

There are also algorithms for finding similar notes that could be used. But I couldn't find plugins that would implement this functionality while being convenient, accessible, and functional - all at the same time.

For example, the Word2Vec algorithm, which I've been interested in for quite a long time. But unfortunately, its implementation is still overly complex for me. Maybe later...

However, besides this algorithm, there are relatively simple options. For example, the TF-IDF algorithm, which was implemented in this plugin.

### Algorithm Description

Overall, the TF-IDF algorithm is quite simple.
It's based on counting term frequency in a note and in the collection of notes.
That is, it calculates the term frequency in a note, then calculates the term frequency in the collection of notes, and then calculates the ratio of term frequency in the note to term frequency in the collection of notes.

Thus, we get a vector that describes the note. And we can compare it with another note's vector to understand how similar they are.

A notable drawback is that it doesn't consider the meaning of terms, only their frequency. And note size has a very large impact - the smaller it is, the less significant its content becomes.

More details are described in the [Algorithm.md](Algorithm.md) file 