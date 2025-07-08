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

func parseLevelsFromHTML(htmlContent string) ([]string, map[string]string, error) {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return nil, nil, err
	}

	var levelIds []string
	var nameByLevelId = map[string]string{}
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "button" {
			for _, attr := range n.Attr {
				if attr.Key == "data-level" {
					levelIds = append(levelIds, attr.Val)
					nameByLevelId[attr.Val] = strings.TrimSpace(n.FirstChild.Data)
					break
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	return levelIds, nameByLevelId, nil
}

func getLevels() ([]string, map[string]string, error) {
	file, err := os.Open("../index.html")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open index.html: %w", err)
	}
	defer file.Close()

	htmlContent, err := io.ReadAll(file)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read index.html: %w", err)
	}

	levelIds, nameByLevelId, err := parseLevelsFromHTML(string(htmlContent))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse levels from HTML: %w", err)
	}

	if len(levelIds) == 0 {
		return nil, nil, errors.New("no levels found in index.html")
	}

	return levelIds, nameByLevelId, nil
}
