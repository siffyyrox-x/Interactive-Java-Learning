class Main {
  public static void main(String[] args) {
    int p, y = 31, w = 16, j = 9, z = 5, c = 5;
    double d = 36;
    p = y / 4 % 3;
    System.out.println(y - p / 2);
    j *= 3;
    w = w / 2 * 3 - j;
    System.out.println(w % 5 + j);
    z += 7;
    d /= 4;
    c = z % c;
    d = 2 + d / c + 19;
    System.out.println(d / 2 + 4 + "x");
    c = c++ + c-- + z++ + --z + ++c;
    System.out.println(c * 2 + d);
  }
}
