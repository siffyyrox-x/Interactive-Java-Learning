class Main {
  public static void main(String[] args) {
    boolean a = (9 % 4 == 1) && true;
    boolean b = !a || (12 / 5 == 2);
    boolean c = (a && b) || false;
    System.out.println(a);
    System.out.println(b);
    System.out.println(c);
    System.out.println((a || b) && !c);
  }
}
