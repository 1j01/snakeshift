package main

import "math/rand"

func shuffle(slice []any) {
	for i := range slice {
		j := rand.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}

func invertCollisionLayer(layer CollisionLayer) CollisionLayer {
	switch layer {
	case White:
		return Black
	case Black:
		return White
	default:
		return layer
	}
}

// func topLayer(hits []Hit) CollisionLayer {
// 	for _, hit := range hits {
// 		if hit.entity.solid {
// 			return hit.layer
// 		}
// 	}
//   return Black
// }

func layersCollide(a CollisionLayer, b CollisionLayer) bool {
	return (a & b) != 0
}

// func hitTestAllEntities(x, y int) []Hit {
// 	return nil
// }

var CardinalDirections = []Point{
	{X: 1, Y: 0},
	{X: 0, Y: 1},
	{X: -1, Y: 0},
	{X: 0, Y: -1},
}
