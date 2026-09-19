class Main {
  public static void main(String[] args) {
    int a = 2, b = 3, c = 4;
    boolean r1 = (++a > 2) || (b++ > 3);
    System.out.println(r1 + " " + a + " " + b + " " + c);
    boolean r2 = (b++ < 4) && (--c == 3);
    System.out.println(r2 + " " + a + " " + b + " " + c);
    boolean r3 = (a++ == 3) && (c++ == 3) || (b > 4);
    System.out.println(r3 + " " + a + " " + b + " " + c);
    System.out.println((r1 && r2) || !r3);
  }
}
