// Parse index.html to get the levels list

package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"golang.org/x/net/html"
)

type LevelEntry struct {
	LevelId      string
	Title        string
	TutorialText string
}

// TODO: parse HTML only once
// TODO: extract tutorial text

func parseLevelsFromHTML(htmlContent string) ([]LevelEntry, error) {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return nil, err
	}

	var levels []LevelEntry
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "button" {
			var level LevelEntry
			for _, attr := range n.Attr {
				if attr.Key == "data-level" {
					level.LevelId = attr.Val
					if n.FirstChild != nil {
						level.Title = strings.TrimSpace(n.FirstChild.Data)
					}
					levels = append(levels, level)
					break
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	return levels, nil
}

func getLevels() ([]LevelEntry, error) {
	file, err := os.Open("../index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to open index.html: %w", err)
	}
	defer file.Close()

	htmlContent, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read index.html: %w", err)
	}

	levels, err := parseLevelsFromHTML(string(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse levels from HTML: %w", err)
	}

	if len(levels) == 0 {
		return nil, errors.New("no levels found in index.html")
	}

	return levels, nil
}
