
func Sign(x int) int {
	// Alternatively:
	// return int(math.Copysign(1, float64(x)))
	if x > 0 {
		return 1
	} else if x < 0 {
		return -1
	}
	return 0
}

func Abs(x int) int {
	// Alternatively:
	// return int(math.Abs(float64(x)))
	if x < 0 {
		return -x
	}
	return x
}
