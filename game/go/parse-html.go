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

func parseLevelsFromHTML(htmlContent string) ([]string, error) {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return nil, err
	}

	var levels []string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "button" {
			for _, attr := range n.Attr {
				if attr.Key == "data-level" {
					levels = append(levels, attr.Val)
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

func getLevels() ([]string, error) {
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
