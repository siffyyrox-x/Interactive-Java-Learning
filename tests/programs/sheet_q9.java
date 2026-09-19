class Main {
  public static void main(String[] args) {
    int p = 18;
    int q = 5;
    int r = 3;
    System.out.println(p - q + r);
    p = p + q * r - p / q;
    System.out.println(p);
    q = p % r + q * 2;
    System.out.println(q);
    r = p / q + r % q;
    System.out.println(r);
    System.out.println(p + q * r - p % q);
    System.out.println((p + q + r) / 4);
  }
}
